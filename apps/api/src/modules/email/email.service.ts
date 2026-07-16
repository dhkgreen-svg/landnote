import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend = new Resend(process.env.RESEND_API_KEY!);
  private from = process.env.RESEND_FROM_EMAIL!;

  async sendNewInquiry(agent: { email: string; agent_name: string }, inquiryId: string) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 새로운 문의가 접수되었습니다',
      html: `<p>${agent.agent_name} 중개사님, 새 문의가 접수되었습니다.</p>
             <a href="${process.env.APP_URL}/dashboard/inquiries/${inquiryId}">확인하기</a>`,
    });
  }

  async sendBillingFailure(agent: { email: string; agent_name: string }, failCount: number) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 결제에 실패했습니다',
      html: `<p>${agent.agent_name} 중개사님, 정기 결제가 실패했습니다. (${failCount}회째)<br>
             3회 실패 시 구독이 만료됩니다.</p>
             <a href="${process.env.APP_URL}/dashboard/settings/billing">카드 변경하기</a>`,
    });
  }

  async sendSubscriptionExpired(agent: { email: string; agent_name: string }) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 구독이 만료되었습니다',
      html: `<p>${agent.agent_name} 중개사님, 구독이 만료되었습니다.</p>
             <a href="${process.env.APP_URL}/dashboard/settings/billing">재구독하기</a>`,
    });
  }

  async sendTrialReminder(agent: { email: string; agent_name: string }) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 무료 체험이 3일 후 종료됩니다',
      html: `<p>${agent.agent_name} 중개사님, 무료 체험이 3일 후 종료됩니다.</p>
             <a href="${process.env.APP_URL}/dashboard/settings/billing">카드 등록하기</a>`,
    });
  }

  async sendCancellationConfirm(agent: { email: string; agent_name: string }) {
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() + 30);
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 구독 해지가 완료되었습니다',
      html: `<p>${agent.agent_name} 중개사님, 해지가 완료되었습니다.<br>
             데이터는 ${deleteDate.toLocaleDateString('ko-KR')}까지 보존됩니다.</p>`,
    });
  }

  async sendWelcome(agent: { email: string; agent_name: string }) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 가입을 환영합니다',
      html: `<p>${agent.agent_name} 중개사님, 랜드노트 가입을 환영합니다.<br>
             7일 무료 체험이 시작되었습니다.</p>
             <a href="${process.env.APP_URL}/dashboard">대시보드 바로가기</a>`,
    });
  }

  async sendBillingSuccess(agent: { email: string; agent_name: string }, amount: number) {
    await this.resend.emails.send({
      from: this.from,
      to: agent.email,
      subject: '[랜드노트] 결제가 완료되었습니다',
      html: `<p>${agent.agent_name} 중개사님, ${amount.toLocaleString('ko-KR')}원 결제가 완료되었습니다.</p>
             <a href="${process.env.APP_URL}/dashboard/settings/billing">결제 내역 확인</a>`,
    });
  }
}
