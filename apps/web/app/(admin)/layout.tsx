import { Metadata } from 'next';
import AdminLayoutClient from './admin-client-layout';

export const metadata: Metadata = {
  title: '랜드노트 시스템 관리자',
  description: '랜드노트 통합 시스템 관리자 앱',
  manifest: '/admin-manifest.json',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
