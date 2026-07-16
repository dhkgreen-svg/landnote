import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE = 10 * 1024 * 1024;
const SIGNED_URL_EXPIRES = 60 * 60; // 1시간

@Injectable()
export class StorageService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async uploadListingImage(
    agentId: string,
    listingId: string,
    file: Express.Multer.File,
    currentImages: { path: string; is_representative: boolean }[],
    maxImages: number,
  ): Promise<{ path: string }> {
    if (!ALLOWED.includes(file.mimetype))
      throw new BadRequestException('허용되지 않는 파일 형식입니다');
    if (file.size > MAX_SIZE)
      throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다');
    if (currentImages.length >= maxImages)
      throw new BadRequestException(`이미지는 최대 ${maxImages}장까지 등록 가능합니다`);

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const storagePath = `agents/${agentId}/listings/${listingId}/${Date.now()}.${ext}`;

    const { error } = await this.supabase.storage
      .from('landnote-media')
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) throw new BadRequestException(`업로드 실패: ${error.message}`);

    const newImage = {
      path: storagePath,
      is_representative: currentImages.length === 0,
      label: null,
      uploaded_at: new Date().toISOString(),
    };

    const { error: updateErr } = await this.supabase
      .from('property_listings')
      .update({ images: [...currentImages, newImage] })
      .eq('id', listingId)
      .eq('agent_id', agentId);

    if (updateErr) {
      await this.supabase.storage.from('landnote-media').remove([storagePath]);
      throw new BadRequestException(`이미지 메타데이터 저장 실패: ${updateErr.message}`);
    }

    return { path: storagePath };
  }

  async uploadInquiryImage(
    agentId: string,
    inquiryId: string,
    file: Express.Multer.File,
  ): Promise<{ path: string }> {
    if (!ALLOWED.includes(file.mimetype))
      throw new BadRequestException('허용되지 않는 파일 형식입니다');
    if (file.size > MAX_SIZE)
      throw new BadRequestException('파일 크기는 10MB를 초과할 수 없습니다');

    // 1) inquiry 존재 확인 (스토리지 업로드 전)
    const { data: inquiry, error: fetchErr } = await this.supabase
      .from('customer_inquiries')
      .select('images')
      .eq('id', inquiryId)
      .eq('agent_id', agentId)
      .single();

    if (fetchErr || !inquiry) {
      throw new BadRequestException('접수를 찾을 수 없습니다');
    }

    // 2) 스토리지 업로드
    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const storagePath = `agents/${agentId}/inquiries/${inquiryId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await this.supabase.storage
      .from('landnote-media')
      .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });

    if (uploadErr) throw new BadRequestException(`업로드 실패: ${uploadErr.message}`);

    // 3) DB 업데이트 + 실패 시 스토리지 롤백
    const existingImages = (inquiry.images ?? []) as { path: string; uploaded_at: string }[];
    const { error: updateErr } = await this.supabase
      .from('customer_inquiries')
      .update({ images: [...existingImages, { path: storagePath, uploaded_at: new Date().toISOString() }] })
      .eq('id', inquiryId)
      .eq('agent_id', agentId);

    if (updateErr) {
      await this.supabase.storage.from('landnote-media').remove([storagePath]);
      throw new BadRequestException(`이미지 메타데이터 저장 실패: ${updateErr.message}`);
    }

    return { path: storagePath };
  }

  async deleteListingImage(
    agentId: string,
    listingId: string,
    targetPath: string,
  ): Promise<void> {
    const { data: listing } = await this.supabase
      .from('property_listings')
      .select('images')
      .eq('id', listingId)
      .eq('agent_id', agentId)
      .single();

    if (!listing) throw new BadRequestException('매물을 찾을 수 없습니다');

    const images: { path: string; is_representative: boolean }[] = listing.images ?? [];
    const filtered = images.filter(img => img.path !== targetPath);

    const wasRepresentative = images.find(img => img.path === targetPath)?.is_representative;
    if (wasRepresentative && filtered.length > 0) {
      filtered[0].is_representative = true;
    }

    // DB 먼저 업데이트 (참조 제거) — 스토리지 파일 삭제보다 DB 정합이 우선
    const { error: updateErr } = await this.supabase
      .from('property_listings')
      .update({ images: filtered })
      .eq('id', listingId)
      .eq('agent_id', agentId);

    if (updateErr) {
      throw new BadRequestException(`이미지 정보 업데이트 실패: ${updateErr.message}`);
    }

    // 스토리지에서 파일 삭제 (실패해도 고아 파일일 뿐, DB는 정합)
    const { error: removeErr } = await this.supabase.storage
      .from('landnote-media')
      .remove([targetPath]);

    if (removeErr) {
      console.warn(`스토리지 파일 삭제 실패 (고아 파일): ${targetPath}`, removeErr.message);
    }
  }

  async attachSignedUrls(
    images: { path: string; is_representative?: boolean; label?: string | null; uploaded_at: string }[]
  ) {
    if (images.length === 0) return [];

    const { data, error } = await this.supabase.storage
      .from('landnote-media')
      .createSignedUrls(
        images.map(img => img.path),
        SIGNED_URL_EXPIRES,
      );

    if (error || !data) {
      return images.map(img => ({ ...img, signed_url: null }));
    }

    return images.map((img, i) => ({
      ...img,
      signed_url: data[i]?.signedUrl ?? null,
    }));
  }
}
