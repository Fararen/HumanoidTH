export function useRouter() {
  return { push: (url: string) => { window.location.href = url; }, refresh: () => window.location.reload() };
}
