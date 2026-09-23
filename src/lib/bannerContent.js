// ─────────────────────────────────────────────────────────────────────────────
// bannerContent.js — SINGLE SOURCE OF TRUTH for all consent-banner copy & data.
//
// Every piece of user-facing banner text and the consent data model (cookie
// categories, IAB purposes, preference-center categories, localization strings)
// lives here. Components must import from this file instead of hardcoding copy,
// so the wording stays consistent across the IAB/TCF banner, the simple
// GDPR/CCPA banner, the preference center, the Content editor, and the scanner.
//
// Consumed by:
//   - components/kit/WIabBanner.jsx        (IAB / TCF banner + preference modal)
//   - components/kit/WEdPreview.jsx        (simple banner + preference-center preview)
//   - components/screens/app/WEdContent.jsx (Content editor + localization)
//   - components/screens/app/WScan.jsx     (cookie scanner category list)
// ─────────────────────────────────────────────────────────────────────────────

// ── Canonical cookie categories (GDPR) ───────────────────────────────────────
// Shared by the IAB banner's "Cookie Categories" tab and the scanner list.
export const cookieCategories = [
  { id: "necessary", name: "Necessary", alwaysActive: true, description: "Necessary cookies are required to enable the basic features of this site, such as providing secure log-in or adjusting your consent preferences. These cookies do not store any personally identifiable data." },
  { id: "functional", name: "Functional", alwaysActive: false, description: "Functional cookies help perform certain functionalities like sharing the content of the website on social media platforms, collecting feedback, and other third-party features." },
  { id: "analytics", name: "Analytics", alwaysActive: false, description: "Analytical cookies are used to understand how visitors interact with the website. These cookies help provide information on metrics such as the number of visitors, bounce rate, traffic source, etc." },
  { id: "performance", name: "Performance", alwaysActive: false, description: "Performance cookies are used to understand and analyze the key performance indexes of the website which helps in delivering a better user experience for the visitors." },
  { id: "advertisement", name: "Advertisement", alwaysActive: false, description: "Advertisement cookies are used to provide visitors with customized advertisements based on the pages you visited previously and to analyze the effectiveness of the ad campaigns." },
  { id: "uncategorized", name: "Uncategorized", alwaysActive: false, description: "Uncategorized cookies are cookies that are currently being reviewed and have not yet been assigned to a specific category." },
];

// ── Scanner cookie categories ────────────────────────────────────────────────
// The scanner and the runtime also emit "marketing" (see the webapp's scan
// dashboard), which isn't one of the banner's canonical categories above.
// Without it here, scanned marketing cookies fell through to Uncategorized and
// couldn't be picked when adding a cookie by hand. Ordered to match the webapp.
export const scanCookieCategories = [
  ...cookieCategories.filter((c) => c.id !== "uncategorized"),
  { id: "marketing", name: "Marketing", alwaysActive: false, description: "Marketing cookies (also referred to as advertising cookies) are used to track visitors across websites using cookies, pixels, and similar tracking technologies. These cookies may be set by us or third-party advertising partners to deliver personalized ads and measure the effectiveness of marketing campaigns." },
  ...cookieCategories.filter((c) => c.id === "uncategorized"),
];

// ── IAB / TCF purposes, special purposes & features ──────────────────────────
export const purposesData = [
  { id: "purposes", title: "Purposes (11)", hasToggle: true, items: [
    { id: "purpose1", title: "Store and/or access information on a device", description: "Cookies, device or similar online identifiers together with other information can be stored or read on your device to recognise it each time it connects to an app or to a website.", vendorCount: 777, hasConsent: true, hasLegitimate: false },
    { id: "purpose2", title: "Use limited data to select advertising", description: "Advertising presented to you on this service can be based on limited data, such as the website or app you are using, your non-precise location, your device type.", vendorCount: 734, hasConsent: true, hasLegitimate: true },
    { id: "purpose3", title: "Create profiles for personalised advertising", description: "Information about your activity on this service can be stored and combined with other information about you to build advertising profiles.", vendorCount: 594, hasConsent: true, hasLegitimate: false },
    { id: "purpose4", title: "Measure advertising performance", description: "Information regarding which advertising is presented to you and how you interact with it can be used to determine how well an advert has worked.", vendorCount: 847, hasConsent: true, hasLegitimate: true },
  ] },
  { id: "special_purposes", title: "Special Purposes (3)", hasToggle: false, items: [
    { id: "specialPurpose1", title: "Ensure security, prevent and detect fraud, and fix errors", description: "Your data can be used to monitor for and prevent unusual and possibly fraudulent activity and ensure systems and processes work properly and securely.", vendorCount: 595, hasConsent: false, hasLegitimate: false },
    { id: "specialPurpose2", title: "Deliver and present advertising and content", description: "Certain information is used to ensure the technical compatibility of the content or advertising, and to facilitate the transmission of the content or ad to your device.", vendorCount: 594, hasConsent: false, hasLegitimate: false },
  ] },
  { id: "features", title: "Features (3)", hasToggle: false, items: [
    { id: "feature1", title: "Match and combine data from other data sources", description: "Information about your activity on this service may be matched and combined with other information relating to you and originating from various sources.", vendorCount: 436, hasConsent: false, hasLegitimate: false },
  ] },
];

// ── IAB / TCF banner copy ────────────────────────────────────────────────────
export const iabBanner = {
  heading: "Your privacy matters to us",
  // Notice paragraph is split so the "third-party vendors" link can be rendered inline.
  noticeBefore: "With your permission, we and ",
  noticeLink: "third-party vendors",
  noticeAfter: " store and/or access information on your device (such as cookies and device identifiers) and process your personal data (including unique identifiers, IP address, browsing activity and approximate location) for the purposes below. Some processing relies on legitimate interest, which you can object to. Choices apply to this website only and can be updated any time via the cookie icon at the bottom-left.",
  // Notice second paragraph (purposes + special features list) — matches webapp.
  noticePurposesIntro: "Our partners collect your information for the following purposes:",
  noticePurposes: "Store and/or access information on a device, Use limited data to select advertising, Create profiles for personalised advertising, Use profiles to select personalised advertising, Create profiles to personalise content, Use profiles to select personalised content, Measure advertising performance, Measure content performance, Understand audiences through statistics or combinations of data from different sources, Develop and improve services, Use limited data to select content.",
  noticeSpecialIntro: "They also use the following special features:",
  noticeSpecial: "Use precise geolocation data, Actively scan device characteristics for identification.",
  modalTitle: "Customise Consent Preferences",
  modalIntro: "Customise your consent preferences for Cookie Categories and advertising tracking preferences for Purposes & Features and Vendors below. You can give granular consent for each Third Party Vendor. Most vendors require explicit consent for personal data processing, while some rely on legitimate interest. However, you have the right to object to their use of legitimate interest.",
  cmpStorageSummary: "How this Consent Management Platform stores your choices",
  cmpStorageBefore: "To remember the choices you make here, this CMP (cmpId 200) stores a TCF v2.2 consent string in the ",
  cmpStorageCookie: "euconsent-v2",
  cmpStorageMid: " cookie and in your browser's ",
  cmpStorageLocalStorage: "localStorage",
  cmpStorageAfter: " for up to 365 days.",
  tabs: [
    { id: "cookie", label: "Cookie Categories" },
    { id: "purpose", label: "Purposes & Features" },
    { id: "vendor", label: "Vendors" },
  ],
  sectionTitles: {
    cookie: "Cookie Categories",
    purpose: "Purposes & Features",
    vendor: "Vendors",
  },
  cookieIntro1: "We use cookies to help you navigate efficiently and perform certain functions. You will find detailed information about all cookies under each consent category below.",
  cookieIntro2: "The cookies that are categorised as \"Necessary\" are stored on your browser as they are essential for enabling the basic functionalities of the site.",
  vendorSearchPlaceholder: "Search vendors by name or ID...",
  vendorPlaceholder: "Vendor list loads at runtime.",
  gacNote: "These Google-certified partners are not on the IAB vendor list. Choose whether they may use your data.",
  labels: {
    alwaysActive: "Always Active",
    legitimate: "Legitimate",
    consent: "Consent",
    vendors: "Vendors:",
    iabVendors: "IAB Vendors",
    googlePartners: "Google Partners",
    privacyPolicy: "Privacy Policy",
    acId: "AC ID:",
  },
  buttons: {
    customise: "Customise",
    rejectAll: "Reject All",
    acceptAll: "Accept All",
    save: "Save My Preferences",
  },
};

// Google Additional Consent (AC) — sample ATP partners (preview only).
export const sampleAtpProviders = [
  { id: 1, name: "Google Advertising Products", policyUrl: "https://policies.google.com/privacy" },
  { id: 2552, name: "Outbrain UK Ltd", policyUrl: "https://www.outbrain.com/legal/privacy" },
  { id: 2657, name: "Index Exchange, Inc.", policyUrl: "https://www.indexexchange.com/privacy/" },
  { id: 3370, name: "Teads", policyUrl: "https://www.teads.com/privacy-policy/" },
  { id: 3052, name: "Sharethrough, Inc.", policyUrl: "https://www.sharethrough.com/privacy-center/" },
];

// ── Simple GDPR/CCPA banner copy ─────────────────────────────────────────────
export const simpleBanner = {
  title: "We value your privacy",
  body: "We use cookies to provide you with the best possible experience. They also allow us to analyze user behavior in order to constantly improve the website for you.",
  buttons: {
    accept: "Accept",
    reject: "Reject",
    preference: "Preference",
  },
};

// ── GDPR preference center ───────────────────────────────────────────────────
export const preferenceBanner = {
  title: "Cookie Preferences",
  overview: "By clicking, you agree to store cookies on your device to enhance navigation, analyze usage, and support marketing.",
  buttons: {
    reject: "Reject",
    save: "Save my preferences",
  },
};

// Preference-center categories (GDPR). Strictly Necessary is always on.
export const prefCategories = [
  { l: "Strictly Necessary", always: true, desc: "Essential cookies enable core site functions like security and accessibility. They don't store personal data and can't be disabled." },
  { l: "Marketing", desc: "Marketing cookies track visitors across websites to display relevant, engaging advertisements." },
  { l: "Analytics", desc: "Analytics cookies help us understand how visitors interact with the website by collecting anonymous usage data." },
  { l: "Preferences", desc: "Preference cookies let the website remember your settings and choices for a more personal experience." },
];

// ── CCPA opt-out banner & preference ─────────────────────────────────────────
export const ccpaBanner = {
  title: "We value your privacy",
  // CCPA initial-banner body — default cookie-usage message shown at the top of the CCPA banner.
  message: "We use cookies to provide you with the best possible experience. They also allow us to analyze user behavior in order to constantly improve the website for you.",
  optOutTitle: "Opt-out Preference",
  optOutBody: "We use third-party cookies that help us analyze how you use this website, store your preferences, and provide the content and advertisements that are relevant to you. We do not sell your information. However, you can opt out of these cookies by checking Do Not Share My Personal Information and clicking the Save My Preferences button. Once you opt out, you can opt in again at any time by unchecking Do Not Share My Personal Information and clicking the Save My Preferences button.",
  doNotShare: "Do Not Share My Personal Information",
  buttons: {
    cancel: "Cancel",
    save: "Save my preferences",
  },
};

// ── Content editor defaults (Default / Preference banner forms) ──────────────
export const editorDefaults = {
  default: {
    rejectLabel: "Reject",
    customizeLabel: "Preference",
    // Names the link for what it is. Only a fallback now — the per-language `policy`
    // in `localization` below is what the Content tab actually applies.
    policyLinkLabel: "Privacy Policy",
    policyUrl: "",
  },
  preference: {
    title: "Cookie Preferences",
    overview: "By clicking, you agree to store cookies on your device to enhance navigation, analyze usage, and support marketing.",
    saveLabel: "Save Edited",
  },
};


// ── Localization (multi-language default banner copy) ────────────────────────
// Key order here drives the Content tab's Language dropdown (WEdContent reads
// Object.keys(localization)), so all four maps below are kept in the SAME order:
// English first, then alphabetical — matching the ConsentBit plugin's dropdown.
// Every language must also exist in the worker's SECTION_LABELS map
// (consent-manager/src/handlers/cdnM.js) — the runtime forces the "Strictly
// Necessary" label from that map using translations.en.languageSelected, so a
// language we offer that the worker doesn't know would fall back to English there.
export const languageCodes = {
  English: "EN",
  Dutch: "NL",
  French: "FR",
  German: "DE",
  Italian: "IT",
  Polish: "PL",
  Portuguese: "PT",
  Spanish: "ES",
  Swedish: "SV",
};

// Preference-center copy per language (title / overview / save / always-active).
export const preferenceLocalization = {
  English: { title: "Cookie Preferences", overview: "By clicking, you agree to store cookies on your device to enhance navigation, analyze usage, and support marketing.", save: "Save my preferences", alwaysActive: "Always Active" },
  Dutch: { title: "Cookievoorkeuren", overview: "Door te klikken gaat u akkoord met het opslaan van cookies op uw apparaat om de navigatie te verbeteren, het gebruik te analyseren en marketing te ondersteunen.", save: "Voorkeuren opslaan", alwaysActive: "Altijd actief" },
  French: { title: "Préférences de cookies", overview: "En cliquant, vous acceptez de stocker des cookies sur votre appareil pour améliorer la navigation, analyser l'utilisation et soutenir le marketing.", save: "Valider mes choix", alwaysActive: "Toujours actif" },
  German: { title: "Cookie-Einstellungen", overview: "Durch Klicken stimmen Sie der Speicherung von Cookies auf Ihrem Gerät zu, um die Navigation zu verbessern, die Nutzung zu analysieren und Marketing zu unterstützen.", save: "Auswahl speichern", alwaysActive: "Immer aktiv" },
  Italian: { title: "Preferenze sui cookie", overview: "Cliccando, accetti di memorizzare i cookie sul tuo dispositivo per migliorare la navigazione, analizzare l'utilizzo e supportare il marketing.", save: "Salva preferenze", alwaysActive: "Sempre attivo" },
  Polish: { title: "Ustawienia plików cookie", overview: "Klikając, wyrażasz zgodę na przechowywanie plików cookie na Twoim urządzeniu w celu poprawy nawigacji, analizy użytkowania i wsparcia marketingu.", save: "Zapisz preferencje", alwaysActive: "Zawsze aktywne" },
  Portuguese: { title: "Preferências de cookies", overview: "Ao clicar, você concorda em armazenar cookies no seu dispositivo para melhorar a navegação, analisar o uso e apoiar o marketing.", save: "Salvar preferências", alwaysActive: "Sempre ativo" },
  Spanish: { title: "Preferencias de cookies", overview: "Al hacer clic, acepta almacenar cookies en su dispositivo para mejorar la navegación, analizar el uso y respaldar el marketing.", save: "Guardar preferencias", alwaysActive: "Siempre activo" },
  Swedish: { title: "Cookie-inställningar", overview: "Genom att klicka godkänner du att cookies lagras på din enhet för att förbättra navigeringen, analysera användningen och stödja marknadsföring.", save: "Spara preferenser", alwaysActive: "Alltid aktiv" },
};

// Cookie-list category name + description per language (order matches prefCategories).
export const categoryLocalization = {
  English: [
    { name: "Strictly Necessary", desc: "Essential cookies enable core site functions like security and accessibility. They don't store personal data and can't be disabled." },
    { name: "Marketing", desc: "Marketing cookies track visitors across websites to display relevant, engaging advertisements." },
    { name: "Analytics", desc: "Analytics cookies help us understand how visitors interact with the website by collecting anonymous usage data." },
    { name: "Preferences", desc: "Preference cookies let the website remember your settings and choices for a more personal experience." },
  ],
  Dutch: [
    { name: "Strikt Noodzakelijk", desc: "Essentiële cookies maken basisfuncties van de site mogelijk, zoals beveiliging en toegankelijkheid. Ze slaan geen persoonlijke gegevens op en kunnen niet worden uitgeschakeld." },
    { name: "Marketing", desc: "Marketingcookies volgen bezoekers op websites om relevante, aantrekkelijke advertenties weer te geven." },
    { name: "Analytisch", desc: "Analytische cookies helpen ons te begrijpen hoe bezoekers omgaan met de website door anonieme gebruiksgegevens te verzamelen." },
    { name: "Voorkeuren", desc: "Voorkeurscookies laten de website uw instellingen en keuzes onthouden voor een persoonlijkere ervaring." },
  ],
  French: [
    { name: "Strictement Nécessaires", desc: "Les cookies essentiels activent les fonctions de base du site comme la sécurité et l'accessibilité. Ils ne stockent pas de données personnelles et ne peuvent pas être désactivés." },
    { name: "Marketing", desc: "Les cookies marketing suivent les visiteurs sur les sites web pour afficher des publicités pertinentes et attrayantes." },
    { name: "Analytiques", desc: "Les cookies analytiques nous aident à comprendre comment les visiteurs interagissent avec le site web en collectant des données d'utilisation anonymes." },
    { name: "Préférences", desc: "Les cookies de préférences permettent au site web de mémoriser vos paramètres et choix pour une expérience plus personnelle." },
  ],
  German: [
    { name: "Unbedingt Notwendig", desc: "Wesentliche Cookies ermöglichen grundlegende Website-Funktionen wie Sicherheit und Barrierefreiheit. Sie speichern keine personenbezogenen Daten und können nicht deaktiviert werden." },
    { name: "Marketing", desc: "Marketing-Cookies verfolgen Besucher über Websites hinweg, um relevante und ansprechende Werbung anzuzeigen." },
    { name: "Analyse", desc: "Analyse-Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, indem anonyme Nutzungsdaten gesammelt werden." },
    { name: "Präferenzen", desc: "Präferenz-Cookies ermöglichen es der Website, Ihre Einstellungen und Auswahl für ein persönlicheres Erlebnis zu speichern." },
  ],
  Italian: [
    { name: "Strettamente Necessari", desc: "I cookie essenziali abilitano le funzioni principali del sito come la sicurezza e l'accessibilità. Non memorizzano dati personali e non possono essere disattivati." },
    { name: "Marketing", desc: "I cookie di marketing tracciano i visitatori sui siti web per mostrare pubblicità pertinenti e coinvolgenti." },
    { name: "Analitica", desc: "I cookie analitici ci aiutano a capire come i visitatori interagiscono con il sito web raccogliendo dati di utilizzo anonimi." },
    { name: "Preferenze", desc: "I cookie di preferenza permettono al sito web di ricordare le tue impostazioni e scelte per un'esperienza più personale." },
  ],
  Polish: [
    { name: "Ściśle Niezbędne", desc: "Niezbędne pliki cookie umożliwiają podstawowe funkcje witryny, takie jak bezpieczeństwo i dostępność. Nie przechowują danych osobowych i nie można ich wyłączyć." },
    { name: "Marketingowe", desc: "Marketingowe pliki cookie śledzą odwiedzających w różnych witrynach, aby wyświetlać trafne i angażujące reklamy." },
    { name: "Analityczne", desc: "Analityczne pliki cookie pomagają nam zrozumieć, jak odwiedzający korzystają z witryny, zbierając anonimowe dane o użytkowaniu." },
    { name: "Preferencje", desc: "Pliki cookie preferencji pozwalają witrynie zapamiętać Twoje ustawienia i wybory, aby zapewnić bardziej spersonalizowane doświadczenie." },
  ],
  Portuguese: [
    { name: "Estritamente Necessários", desc: "Os cookies essenciais permitem funções básicas do site, como segurança e acessibilidade. Não armazenam dados pessoais e não podem ser desativados." },
    { name: "Marketing", desc: "Os cookies de marketing rastreiam visitantes em diferentes sites para exibir anúncios relevantes e atrativos." },
    { name: "Analíticos", desc: "Os cookies analíticos ajudam-nos a entender como os visitantes interagem com o site, recolhendo dados de utilização anónimos." },
    { name: "Preferências", desc: "Os cookies de preferências permitem que o site memorize as suas definições e escolhas para uma experiência mais personalizada." },
  ],
  Spanish: [
    { name: "Estrictamente Necesarias", desc: "Las cookies esenciales habilitan funciones básicas del sitio como la seguridad y la accesibilidad. No almacenan datos personales y no se pueden desactivar." },
    { name: "Marketing", desc: "Las cookies de marketing rastrean a los visitantes en los sitios web para mostrar anuncios relevantes y atractivos." },
    { name: "Analíticas", desc: "Las cookies analíticas nos ayudan a comprender cómo interactúan los visitantes con el sitio web mediante la recopilación de datos de uso anónimos." },
    { name: "Preferencias", desc: "Las cookies de preferencias permiten que el sitio web recuerde su configuración y elecciones para una experiencia más personal." },
  ],
  Swedish: [
    { name: "Strikt Nödvändiga", desc: "Nödvändiga cookies möjliggör grundläggande webbplatsfunktioner som säkerhet och tillgänglighet. De lagrar inga personuppgifter och kan inte inaktiveras." },
    { name: "Marknadsföring", desc: "Marknadsföringscookies spårar besökare över webbplatser för att visa relevanta och engagerande annonser." },
    { name: "Analytik", desc: "Analyscookies hjälper oss att förstå hur besökare interagerar med webbplatsen genom att samla in anonym användningsdata." },
    { name: "Inställningar", desc: "Inställningscookies låter webbplatsen komma ihåg dina val och inställningar för en mer personlig upplevelse." },
  ],
};

// CCPA opt-out copy per language.
export const ccpaLocalization = {
  English: { message: "We use cookies to provide you with the best possible experience. They also allow us to analyze user behavior in order to constantly improve the website for you.", optOutTitle: "Opt-out Preference", optOutBody: "We use third-party cookies that help us analyze how you use this website, store your preferences, and provide the content and advertisements that are relevant to you. We do not sell your information. However, you can opt out of these cookies by checking Do Not Share My Personal Information and clicking the Save My Preferences button. Once you opt out, you can opt in again at any time by unchecking Do Not Share My Personal Information and clicking the Save My Preferences button.", doNotShare: "Do Not Share My Personal Information", cancel: "Cancel", save: "Save my preferences" },
  Dutch: { message: "We gebruiken cookies om u de best mogelijke ervaring te bieden. Ze stellen ons ook in staat om gebruikersgedrag te analyseren om de website voortdurend voor u te verbeteren.", optOutTitle: "Opt-outvoorkeur", optOutBody: "We gebruiken cookies van derden die ons helpen analyseren hoe u deze website gebruikt, uw voorkeuren op te slaan en de inhoud en advertenties te bieden die voor u relevant zijn. We verkopen uw informatie niet. U kunt deze cookies echter weigeren door Mijn persoonlijke gegevens niet delen aan te vinken en op de knop Mijn voorkeuren opslaan te klikken. Zodra u zich hebt afgemeld, kunt u zich op elk moment opnieuw aanmelden door het vinkje te verwijderen en opnieuw op te slaan.", doNotShare: "Mijn persoonlijke gegevens niet delen", cancel: "Annuleren", save: "Voorkeuren opslaan" },
  French: { message: "Nous utilisons des cookies pour vous offrir la meilleure expérience possible. Ils nous permettent également d'analyser le comportement des utilisateurs afin d'améliorer constamment le site web pour vous.", optOutTitle: "Préférence de désinscription", optOutBody: "Nous utilisons des cookies tiers qui nous aident à analyser votre utilisation de ce site web, à stocker vos préférences et à fournir le contenu et les publicités qui vous sont pertinents. Nous ne vendons pas vos informations. Cependant, vous pouvez refuser ces cookies en cochant Ne pas partager mes informations personnelles et en cliquant sur le bouton Enregistrer mes préférences. Une fois désinscrit, vous pouvez vous réinscrire à tout moment en décochant Ne pas partager mes informations personnelles et en cliquant sur le bouton Enregistrer mes préférences.", doNotShare: "Ne pas partager mes informations personnelles", cancel: "Annuler", save: "Valider mes choix" },
  German: { message: "Wir verwenden Cookies, um Ihnen das bestmögliche Erlebnis zu bieten. Sie ermöglichen es uns außerdem, das Nutzerverhalten zu analysieren, um die Website kontinuierlich für Sie zu verbessern.", optOutTitle: "Opt-out-Einstellung", optOutBody: "Wir verwenden Cookies von Drittanbietern, die uns helfen zu analysieren, wie Sie diese Website nutzen, Ihre Einstellungen zu speichern und die für Sie relevanten Inhalte und Werbeanzeigen bereitzustellen. Wir verkaufen Ihre Informationen nicht. Sie können diese Cookies jedoch ablehnen, indem Sie Meine personenbezogenen Daten nicht weitergeben ankreuzen und auf die Schaltfläche Meine Einstellungen speichern klicken. Sobald Sie sich abgemeldet haben, können Sie sich jederzeit wieder anmelden, indem Sie das Häkchen entfernen und erneut speichern.", doNotShare: "Meine personenbezogenen Daten nicht weitergeben", cancel: "Abbrechen", save: "Auswahl speichern" },
  Italian: { message: "Utilizziamo i cookie per offrirti la migliore esperienza possibile. Ci permettono inoltre di analizzare il comportamento degli utenti per migliorare costantemente il sito web per te.", optOutTitle: "Preferenza di rinuncia", optOutBody: "Utilizziamo cookie di terze parti che ci aiutano ad analizzare come utilizzi questo sito web, a memorizzare le tue preferenze e a fornire i contenuti e gli annunci pertinenti per te. Non vendiamo le tue informazioni. Tuttavia, puoi rinunciare a questi cookie selezionando Non condividere le mie informazioni personali e facendo clic sul pulsante Salva le mie preferenze. Dopo la rinuncia, puoi acconsentire nuovamente in qualsiasi momento deselezionando la casella e salvando di nuovo.", doNotShare: "Non condividere le mie informazioni personali", cancel: "Annulla", save: "Salva preferenze" },
  Polish: { message: "Używamy plików cookie, aby zapewnić Ci najlepsze możliwe doświadczenie. Pozwalają nam one również analizować zachowanie użytkowników, aby stale ulepszać stronę dla Ciebie.", optOutTitle: "Preferencja rezygnacji", optOutBody: "Używamy zewnętrznych plików cookie, które pomagają nam analizować, jak korzystasz z tej witryny, przechowywać Twoje preferencje oraz dostarczać treści i reklamy, które są dla Ciebie istotne. Nie sprzedajemy Twoich informacji. Możesz jednak zrezygnować z tych plików cookie, zaznaczając Nie udostępniaj moich danych osobowych i klikając przycisk Zapisz moje preferencje. Po rezygnacji możesz w każdej chwili wyrazić zgodę ponownie, odznaczając to pole i zapisując ponownie.", doNotShare: "Nie udostępniaj moich danych osobowych", cancel: "Anuluj", save: "Zapisz preferencje" },
  Portuguese: { message: "Usamos cookies para lhe proporcionar a melhor experiência possível. Também nos permitem analisar o comportamento dos utilizadores para melhorar constantemente o site para si.", optOutTitle: "Preferência de exclusão", optOutBody: "Usamos cookies de terceiros que nos ajudam a analisar como utiliza este site, a armazenar as suas preferências e a fornecer os conteúdos e anúncios que são relevantes para si. Não vendemos as suas informações. No entanto, pode recusar estes cookies marcando Não partilhar as minhas informações pessoais e clicando no botão Guardar as minhas preferências. Depois de recusar, pode voltar a aceitar a qualquer momento desmarcando a caixa e guardando novamente.", doNotShare: "Não partilhar as minhas informações pessoais", cancel: "Cancelar", save: "Salvar preferências" },
  Spanish: { message: "Utilizamos cookies para brindarle la mejor experiencia posible. También nos permiten analizar el comportamiento de los usuarios para mejorar constantemente el sitio web para usted.", optOutTitle: "Preferencia de exclusión", optOutBody: "Usamos cookies de terceros que nos ayudan a analizar cómo usa este sitio web, almacenar sus preferencias y proporcionar el contenido y los anuncios relevantes para usted. No vendemos su información. Sin embargo, puede excluir estas cookies marcando No compartir mi información personal y haciendo clic en el botón Guardar mis preferencias. Una vez que se excluya, puede volver a incluirse en cualquier momento desmarcando No compartir mi información personal y haciendo clic en el botón Guardar mis preferencias.", doNotShare: "No compartir mi información personal", cancel: "Cancelar", save: "Guardar preferencias" },
  Swedish: { message: "Vi använder cookies för att ge dig bästa möjliga upplevelse. De gör det också möjligt för oss att analysera användarbeteende för att ständigt förbättra webbplatsen för dig.", optOutTitle: "Avanmälningsinställning", optOutBody: "Vi använder tredjepartscookies som hjälper oss att analysera hur du använder den här webbplatsen, lagra dina inställningar och tillhandahålla innehåll och annonser som är relevanta för dig. Vi säljer inte dina uppgifter. Du kan dock välja bort dessa cookies genom att markera Dela inte mina personuppgifter och klicka på knappen Spara mina inställningar. När du har valt bort dem kan du när som helst välja in igen genom att avmarkera rutan och spara på nytt.", doNotShare: "Dela inte mina personuppgifter", cancel: "Avbryt", save: "Spara preferenser" },
};

export const localization = {
  English: { title: "We value your privacy", message: "We use cookies to enhance your browsing experience, serve personalised ads or content, and analyse our traffic. By clicking \"Accept\", you consent to our use of cookies.", accept: "Accept", reject: "Reject", customize: "Preference", policy: "Privacy Policy" },
  Dutch: { title: "Wij waarderen uw privacy", message: "We gebruiken cookies om uw browse-ervaring te verbeteren, gepersonaliseerde advertenties of inhoud weer te geven en ons verkeer te analyseren. Door op \"Accepteren\" te klikken, stemt u in met ons gebruik van cookies.", accept: "Accepteren", reject: "Weigeren", customize: "Voorkeuren", policy: "Privacybeleid" },
  French: { title: "Nous respectons votre vie privée", message: "Nous utilisons des cookies pour améliorer votre expérience de navigation, diffuser des publicités ou contenus personnalisés et analyser notre trafic. En cliquant sur « Accepter », vous consentez à notre utilisation des cookies.", accept: "Accepter", reject: "Refuser", customize: "Préférences", policy: "Politique de confidentialité" },
  German: { title: "Wir schätzen Ihre Privatsphäre", message: "Wir verwenden Cookies, um Ihr Surferlebnis zu verbessern, personalisierte Anzeigen oder Inhalte bereitzustellen und unseren Datenverkehr zu analysieren. Durch Klicken auf „Akzeptieren“ stimmen Sie unserer Verwendung von Cookies zu.", accept: "Akzeptieren", reject: "Ablehnen", customize: "Einstellungen", policy: "Datenschutzrichtlinie" },
  Italian: { title: "Rispettiamo la tua privacy", message: "Utilizziamo i cookie per migliorare la tua esperienza di navigazione, offrire annunci o contenuti personalizzati e analizzare il nostro traffico. Cliccando su «Accetta», acconsenti al nostro utilizzo dei cookie.", accept: "Accetta", reject: "Rifiuta", customize: "Preferenze", policy: "Informativa sulla privacy" },
  Polish: { title: "Cenimy Twoją prywatność", message: "Używamy plików cookie, aby ulepszyć Twoje doświadczenie przeglądania, wyświetlać spersonalizowane reklamy lub treści oraz analizować nasz ruch. Klikając „Akceptuj”, wyrażasz zgodę na używanie przez nas plików cookie.", accept: "Akceptuj", reject: "Odrzuć", customize: "Preferencje", policy: "Polityka prywatności" },
  Portuguese: { title: "Valorizamos a sua privacidade", message: "Utilizamos cookies para melhorar a sua experiência de navegação, apresentar anúncios ou conteúdos personalizados e analisar o nosso tráfego. Ao clicar em «Aceitar», consente a nossa utilização de cookies.", accept: "Aceitar", reject: "Rejeitar", customize: "Preferências", policy: "Política de privacidade" },
  Spanish: { title: "Valoramos su privacidad", message: "Usamos cookies para mejorar su experiencia de navegación, mostrar anuncios o contenido personalizado y analizar nuestro tráfico. Al hacer clic en «Aceptar», acepta nuestro uso de cookies.", accept: "Aceptar", reject: "Rechazar", customize: "Preferencias", policy: "Política de privacidad" },
  Swedish: { title: "Vi värnar om din integritet", message: "Vi använder cookies för att förbättra din surfupplevelse, visa personanpassade annonser eller innehåll och analysera vår trafik. Genom att klicka på ”Acceptera” samtycker du till vår användning av cookies.", accept: "Acceptera", reject: "Avvisa", customize: "Inställningar", policy: "Integritetspolicy" },
};
