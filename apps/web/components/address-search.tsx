'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

declare global {
  interface Window {
    daum: any;
  }
}

interface AddressResult {
  address_full: string;
  address_road: string;
  address_jibun: string;
  dong_name: string;
  building_name?: string;
  is_apartment?: boolean;
}

interface AddressSearchProps {
  value?: string;
  onComplete: (result: AddressResult) => void;
  placeholder?: string;
  buttonText?: string;
}

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadDaumPostcodeScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    if (scriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }
    scriptLoading = true;
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

export function AddressSearch({ value, onComplete, placeholder, buttonText }: AddressSearchProps) {
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      loadDaumPostcodeScript();
    }
  }, []);

  const handleClick = useCallback(async () => {
    await loadDaumPostcodeScript();

    new window.daum.Postcode({
      oncomplete(data: any) {
        const address_road = data.roadAddress || '';
        const address_jibun = data.jibunAddress || '';
        const address_full = address_road || address_jibun;
        const dong_name = data.bname || '';
        const building_name = data.buildingName || '';
        const is_apartment = data.apartment === 'Y';

        onComplete({ address_full, address_road, address_jibun, dong_name, building_name, is_apartment });
      },
    }).open();
  }, [onComplete]);

  return (
    <div className="flex gap-2">
      <Input
        readOnly
        value={value ?? ''}
        placeholder={placeholder ?? '주소를 검색하세요'}
        className="flex-1 cursor-pointer bg-muted/50"
        onClick={handleClick}
      />
      <Button type="button" variant="outline" size="sm" onClick={handleClick}>
        <Search className="mr-1 h-3.5 w-3.5" />
        {buttonText ?? '주소 검색'}
      </Button>
    </div>
  );
}
