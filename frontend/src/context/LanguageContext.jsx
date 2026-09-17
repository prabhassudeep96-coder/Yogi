import { createContext, useContext, useState, useCallback } from "react";

const TRANSLATIONS = {
  en: {
    admin: "Admin",
    hero_title: "Your gateway to online services",
    hero_subtitle: "Search government applications, scholarships, certificates and documents — all in one place at {brand}.",
    search_placeholder: "Search applications, services, documents…",
    all: "All",
    trending: "Trending Applications",
    all_apps: "All Applications",
    search_results: "Search Results",
    no_results: "No matching applications or services found.",
    no_results_hint: "Try a different keyword or category.",
    empty_title: "No applications available yet",
    empty_subtitle: "New services and applications will appear here soon. Please check back later.",
    loading: "Loading applications…",
    view_details: "View Details",
    last_date: "Last date",
    days_left: "{n} days left",
    ends_today: "Ends today",
    closed: "Closed",
    about: "About {brand}",
    contact_us: "Contact Us",
    landline: "Landline",
    whatsapp: "WhatsApp",
    email: "Email",
    location: "Location",
    view_map: "View on Google Maps",
    contact_empty: "Contact details will be updated soon.",
    about_desc: "About / Description",
    start_date: "Start Date",
    last_date_label: "Last Date",
    documents_required: "Documents Required",
    important_instructions: "Important Instructions",
    apply_now: "Official Website / Apply Now",
  },
  kn: {
    admin: "ನಿರ್ವಾಹಕ",
    hero_title: "ಆನ್‌ಲೈನ್ ಸೇವೆಗಳಿಗೆ ನಿಮ್ಮ ಹೆಬ್ಬಾಗಿಲು",
    hero_subtitle: "ಸರ್ಕಾರಿ ಅರ್ಜಿಗಳು, ವಿದ್ಯಾರ್ಥಿವೇತನ, ಪ್ರಮಾಣಪತ್ರಗಳು ಮತ್ತು ದಾಖಲೆಗಳನ್ನು ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ {brand} ನಲ್ಲಿ ಹುಡುಕಿ.",
    search_placeholder: "ಅರ್ಜಿಗಳು, ಸೇವೆಗಳು, ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಿ…",
    all: "ಎಲ್ಲಾ",
    trending: "ಜನಪ್ರಿಯ ಅರ್ಜಿಗಳು",
    all_apps: "ಎಲ್ಲಾ ಅರ್ಜಿಗಳು",
    search_results: "ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು",
    no_results: "ಯಾವುದೇ ಹೊಂದಾಣಿಕೆಯ ಅರ್ಜಿಗಳು ಅಥವಾ ಸೇವೆಗಳು ಸಿಗಲಿಲ್ಲ.",
    no_results_hint: "ಬೇರೆ ಪದ ಅಥವಾ ವರ್ಗವನ್ನು ಪ್ರಯತ್ನಿಸಿ.",
    empty_title: "ಇನ್ನೂ ಯಾವುದೇ ಅರ್ಜಿಗಳಿಲ್ಲ",
    empty_subtitle: "ಹೊಸ ಸೇವೆಗಳು ಮತ್ತು ಅರ್ಜಿಗಳು ಶೀಘ್ರದಲ್ಲೇ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ. ದಯವಿಟ್ಟು ನಂತರ ಪರಿಶೀಲಿಸಿ.",
    loading: "ಅರ್ಜಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…",
    view_details: "ವಿವರಗಳನ್ನು ನೋಡಿ",
    last_date: "ಕೊನೆಯ ದಿನಾಂಕ",
    days_left: "{n} ದಿನ ಬಾಕಿ",
    ends_today: "ಇಂದು ಕೊನೆ",
    closed: "ಮುಚ್ಚಲಾಗಿದೆ",
    about: "{brand} ಬಗ್ಗೆ",
    contact_us: "ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ",
    landline: "ಲ್ಯಾಂಡ್‌ಲೈನ್",
    whatsapp: "ವಾಟ್ಸಾಪ್",
    email: "ಇಮೇಲ್",
    location: "ಸ್ಥಳ",
    view_map: "ಗೂಗಲ್ ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ",
    contact_empty: "ಸಂಪರ್ಕ ವಿವರಗಳನ್ನು ಶೀಘ್ರದಲ್ಲೇ ನವೀಕರಿಸಲಾಗುವುದು.",
    about_desc: "ಬಗ್ಗೆ / ವಿವರಣೆ",
    start_date: "ಪ್ರಾರಂಭ ದಿನಾಂಕ",
    last_date_label: "ಕೊನೆಯ ದಿನಾಂಕ",
    documents_required: "ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು",
    important_instructions: "ಪ್ರಮುಖ ಸೂಚನೆಗಳು",
    apply_now: "ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ / ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("yogi_lang") || "en");

  const toggle = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "kn" : "en";
      localStorage.setItem("yogi_lang", next);
      return next;
    });
  }, []);

  const t = useCallback(
    (key, vars = {}) => {
      let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
      return str;
    },
    [lang]
  );

  return <LanguageContext.Provider value={{ lang, toggle, t }}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext);

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}
