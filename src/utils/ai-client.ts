export const encodeHeader = (str: string) => {
  try {
    return encodeURIComponent(str);
  } catch (e) {
    return str;
  }
};

export const sanitizeApiProfiles = (profiles: any[]): any[] => {
  if (!Array.isArray(profiles)) return [];
  return profiles.map(p => ({
    id: p.id,
    baseUrl: p.baseUrl,
    model: p.model,
    apiKey: p.apiKey
  }));
};

export const fetchAI = async (endpoint: string, options: RequestInit = {}) => {
  const configStr = localStorage.getItem('ai_provider_config') || '{}';
  let cleanProfiles: any[] = [];
  try {
    const raw = JSON.parse(localStorage.getItem('og_driver_profiles') || '[]');
    cleanProfiles = sanitizeApiProfiles(raw);
  } catch (e) {}

  const headers = new Headers(options.headers || {});
  headers.set('X-Provider-Config', encodeHeader(configStr));
  headers.set('X-Driver-Profiles', encodeHeader(JSON.stringify(cleanProfiles)));
  
  return fetch(endpoint, {
    ...options,
    headers
  });
};

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export const safeFetchAIJson = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries = 2
): Promise<SafeFetchResult<T>> => {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const res = await fetchAI(endpoint, options);
      const rawText = await res.text();

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Body is not JSON (e.g. server starting up, Vite HTML fallback, or proxy page)
        const isServerStarting = rawText.includes('Starting Server') || rawText.includes('color-scheme') || rawText.includes('<!DOCTYPE');
        if (isServerStarting && attempt < maxRetries) {
          attempt++;
          await new Promise(r => setTimeout(r, 1200));
          continue;
        }

        let cleanSnippet = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (cleanSnippet.includes('Starting Server') || cleanSnippet.includes('color-scheme')) {
          cleanSnippet = 'Máy chủ dịch vụ đang khởi động lại hoặc kết nối chưa sẵn sàng. Vui lòng bấm thử lại trong giây lát.';
        } else if (cleanSnippet.length > 120) {
          cleanSnippet = cleanSnippet.slice(0, 120) + '...';
        }

        return {
          ok: false,
          status: res.status,
          error: cleanSnippet ? `Máy chủ phản hồi (mã ${res.status}): ${cleanSnippet}` : `Máy chủ phản hồi mã lỗi ${res.status}`
        };
      }

      // Capture High Demand event from server header or payload
      const isHighDemand = 
        res.headers.get('X-Gemini-High-Demand') === 'true' || 
        (parsed && (parsed.highDemand || parsed.isHighDemand)) ||
        (parsed && typeof parsed.error === 'string' && (parsed.error.includes('503') || parsed.error.includes('high demand') || parsed.error.includes('quá tải')));

      if (isHighDemand && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('og-gemini-high-demand', {
          detail: { model: parsed?.modelUsed || 'Gemini 3.7 Flash' }
        }));
      }

      if (!res.ok || (parsed && parsed.success === false)) {
        return {
          ok: false,
          status: res.status,
          data: parsed,
          error: (parsed && (parsed.error || parsed.message)) || `Máy chủ phản hồi mã lỗi ${res.status}`
        };
      }

      return {
        ok: true,
        status: res.status,
        data: parsed
      };
    } catch (err: any) {
      if (attempt < maxRetries) {
        attempt++;
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return {
        ok: false,
        status: 0,
        error: err?.message || 'Không thể kết nối tới máy chủ dịch vụ.'
      };
    }
  }

  return {
    ok: false,
    status: 0,
    error: 'Máy chủ phản hồi không đúng định dạng JSON.'
  };
};
