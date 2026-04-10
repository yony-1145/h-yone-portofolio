export const locales = ['en', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'ja';
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, maybeLocale] = url.pathname.split('/');
  return isLocale(maybeLocale) ? maybeLocale : defaultLocale;
}

export function stripLocaleFromPathname(pathname: string): string {
  const parts = pathname.split('/');
  const maybeLocale = parts[1];
  if (!isLocale(maybeLocale)) return pathname;
  const stripped = '/' + parts.slice(2).join('/');
  return stripped === '//' ? '/' : stripped.replace(/\/+$/, '') || '/';
}

export function localizePath(pathname: string, locale: Locale): string {
  const base = stripLocaleFromPathname(pathname);
  if (locale === defaultLocale) return base === '' ? '/' : base;
  if (base === '/') return `/${locale}/`;
  return `/${locale}${base.startsWith('/') ? '' : '/'}${base}`;
}

export function getLocaleStaticPaths() {
  return locales.map((locale) => ({
    params: { locale: locale === defaultLocale ? undefined : locale },
  }));
}

const dict = {
  en: {
    'menu.home': 'Home',
    'menu.works': 'Works',
    'menu.about': 'About me',
    'menu.contact': 'Contact',
    'lang.switchTo': '日本語',
    'footer.privacy': 'Privacy policy',
    'footer.tagline': 'Build, Deliver, Connect.',
    'footer.email': 'contact@h-yone.com',
    'cta.contact': 'Contact Me',
    'cta.getInTouch': 'Get in touch',

    'a11y.navMain': 'Main navigation',
    'a11y.openMenu': 'Open main menu',
    'a11y.closeMenu': 'Close menu',
    'a11y.switchLang': 'Switch language',
    'a11y.contactFab': 'Contact',
    'a11y.footerNav': 'Footer navigation',
    'footer.rightsReserved': 'All rights reserved.',

    'page.404.title': 'This page could not be found.',
    'page.404.desc':
      'You may have mistyped the address or the page may have moved.',
    'page.404.backHome': 'Go back home',

    'page.index.title': 'Web Engineer Portfolio',
    'page.index.description':
      'Portfolio of h-yone — a Web Engineer who loves Salesforce and modern web development.',
    'page.index.hero.badge': 'Web Engineer',
    'page.index.hero.heading': 'Build, Deliver, Connect.',
    'page.index.hero.desc':
      "Hi, I'm Yone!\nI build business systems on Salesforce by day, and create web apps with Next.js/TypeScript in my personal projects.\nI'm drawn to the problem-solving power of IT, and I'm always working to sharpen my skills.",
    'page.index.hero.available': '✔ Open to new challenges',
    'page.index.hero.profileImageAlt': 'Profile photo placeholder',
    'page.index.skills.heading': 'Technical Skills',
    'page.index.skills.desc':
      'My everyday tech stack — from enterprise development to modern web and design.',
    'page.index.skills.frontend.title': 'Web Development',
    'page.index.skills.frontend.desc':
      'My main stack is Next.js, React, and TypeScript. I build responsive UIs with Tailwind CSS — and I enjoy the entire process of turning ideas into working systems.',
    'page.index.skills.backend.title': 'Salesforce Platform',
    'page.index.skills.backend.desc':
      'Designing and building business applications with Apex, LWC, and Flow. Currently responsible for a CRM system used by 600+ people daily — from requirements definition through to release.',
    'page.index.skills.devops.title': 'Design & Architecture',
    'page.index.skills.devops.desc':
      'I value understanding the "why" before writing code. Requirements analysis, specifications, database design, test planning — I always strive to build maintainable systems.',
    'page.index.projects.heading': 'Selected Work',
    'page.index.projects.desc':
      'A look at some of my recent projects and contributions.',
    'page.index.projects.coworker.badge': 'Personal Project',
    'page.index.projects.coworker.title': 'Coworker',
    'page.index.projects.coworker.desc1':
      'Born from my own question — "Where should I work today?" — this app lets you find and share cafes and coworking spaces on a map.',
    'page.index.projects.coworker.desc2':
      'Built with Next.js, TypeScript, Prisma, and MapLibre. Search by amenities like Wi-Fi and power outlets, and post your favorite spots with photos.',
    'page.index.projects.coworker.liveDemo': 'Live Demo',
    'page.index.projects.coworker.sourceCode': 'Source Code',
    'page.index.projects.coworker.imageAlt': 'Coworker app — project preview image',
    'page.index.projects.hakatamingle.badge': 'Web Support',
    'page.index.projects.hakatamingle.title': '101 Hakatamingle',
    'page.index.projects.hakatamingle.desc1':
      "101 Hakatamingle is an international exchange community that offers a place for new connections and learning. With regular meetups, BBQs, cooking events, and more — it's a fun, natural way to practice English.",
    'page.index.projects.hakatamingle.desc2':
      "I support the operation of the community's website. I also attend events in person, because I believe in listening to feedback from the ground.",
    'page.index.projects.hakatamingle.visitSite': 'Visit Site',
    'page.index.projects.hakatamingle.imageAlt': '101 Hakatamingle — project preview image',
    'page.index.testimonials.heading': 'What People Say',
    'page.index.testimonials.desc':
      "Feedback from colleagues and clients I've had the pleasure of working with.",
    'page.index.testimonials.1.quote':
      'A reliable engineer who always takes the time to understand our business needs before diving into code. The system has been running smoothly ever since.',
    'page.index.testimonials.1.author': 'Project Manager',
    'page.index.testimonials.1.role': 'Business System Project',
    'page.index.testimonials.2.quote':
      'Great at translating complex requirements into clean, well-structured solutions. Always a pleasure to work with.',
    'page.index.testimonials.2.author': 'Team Lead',
    'page.index.testimonials.2.role': 'Salesforce Development',
    'page.index.testimonials.3.quote':
      'Built exactly what we needed — a practical solution that solves a real problem. Very responsive and easy to communicate with.',
    'page.index.testimonials.3.author': 'Community Organizer',
    'page.index.testimonials.3.role': 'Web Support Project',
    'page.index.testimonials.aria.1': 'Go to testimonial 1',
    'page.index.testimonials.aria.2': 'Go to testimonial 2',
    'page.index.testimonials.aria.3': 'Go to testimonial 3',
    'page.index.cta.badge': 'Connect',
    'page.index.cta.heading': "Let's build something great together",
    'page.index.cta.desc':
      "Got a project idea? Need a hand with Salesforce or web development? Or just want to chat about tech? I'd love to hear from you — don't hesitate to reach out.",
    'page.index.cta.available': '✔ Open to new challenges and collaborations',

    'page.about.title': 'About Me',
    'page.about.description':
      'Learn more about h-yone — background, skills, and approach.',
    'page.about.hero.badge': 'Web Engineer',
    'page.about.hero.heading': 'Build, Deliver, Connect.',
    'page.about.hero.desc':
      'A Web Engineer building business systems on Salesforce and creating web apps with Next.js/TypeScript.',
    'page.about.hero.available': '✔ Open to new challenges',
    'page.about.hero.profileImageAlt': 'Profile photo placeholder',
    'page.about.timeline.heading': 'My Journey',
    'page.about.timeline.desc':
      'A chronological look at my career path and key milestones.',
    'page.about.timeline.1.period': '2026 – Present',
    'page.about.timeline.1.title': '101 Hakatamingle',
    'page.about.timeline.1.subtitle':
      "Running Fukuoka's largest international exchange community",
    'page.about.timeline.1.desc':
      'Website operations and application development for building a revenue platform.',
    'page.about.timeline.1.tags': 'Wix,Studio',
    'page.about.timeline.1.link1': 'Website',
    'page.about.timeline.2.period': '2024 – Present',
    'page.about.timeline.2.title': 'Personal Projects',
    'page.about.timeline.2.subtitle': 'Turning ideas into reality',
    'page.about.timeline.2.desc': 'Full-stack web applications.',
    'page.about.timeline.2.tags': 'Next.js,Astro,TypeScript,Supabase,Firebase,AWS',
    'page.about.timeline.2.link1': 'GitHub',
    'page.about.timeline.3.period': '2023 – Present',
    'page.about.timeline.3.title': 'Salesforce Engineer',
    'page.about.timeline.3.subtitle': 'Enterprise CRM Development',
    'page.about.timeline.3.desc':
      'Turning stakeholder conversations into structured solutions. Full-cycle delivery from design to release, building systems aligned with real business needs.',
    'page.about.timeline.3.tags': 'Apex,LWC,Flow,SOQL',
    'page.about.aboutme.heading': 'About Me',
    'page.about.aboutme.body':
      "Born in 2001, from Chiba. Currently based in Fukuoka.\nI value listening first over jumping straight into code — I believe good work starts with understanding the other person's challenges.\nFeel free to reach out anytime.",

    'page.contact.title': 'Contact',
    'page.contact.description': 'Get in touch with me.',
    'page.contact.heading': "Let's Talk!",
    'page.contact.desc':
      "Whether you have a work inquiry, a technical question, or just want to say hi, I'd love to hear from you. I typically respond within 24 hours.",
    'page.contact.form.name': 'Name',
    'page.contact.form.email': 'Email',
    'page.contact.form.emailPlaceholder': 'you@example.com',
    'page.contact.form.inquiryType': 'Inquiry Type',
    'page.contact.form.inquiryPlaceholder': 'Please choose one...',
    'page.contact.form.inquiryProject': 'Project Inquiry',
    'page.contact.form.inquiryConsultation': 'Technical Consultation',
    'page.contact.form.inquiryChat': 'Casual Chat / Networking',
    'page.contact.form.inquiryOther': 'Other',
    'page.contact.form.message': 'Message',
    'page.contact.form.send': 'Send',
    'page.contact.form.sending': 'Sending...',
    'page.contact.form.success':
      'Thank you! Your message has been sent successfully.',
    'page.contact.form.error': 'Something went wrong. Please try again.',
    'page.contact.form.error.validation':
      'Please check your input and try again.',
    'page.contact.form.error.turnstile':
      'Security verification failed. Please retry the challenge.',
    'page.contact.form.subject': 'New Inquiry from h-yone Portfolio Site',

    'page.privacy.title': 'Privacy Policy',
    'page.privacy.description': 'Our privacy policy.',
  },
  ja: {
    'menu.home': 'ホーム',
    'menu.works': '実績',
    'menu.about': '自己紹介',
    'menu.contact': 'お問い合わせ',
    'lang.switchTo': 'English',
    'footer.privacy': 'プライバシーポリシー',
    'footer.tagline': '『つくる、届ける、つなげる。』',
    'footer.email': 'contact@h-yone.com',
    'cta.contact': 'お問い合わせ',
    'cta.getInTouch': 'お問い合わせ',

    'a11y.navMain': 'メインナビゲーション',
    'a11y.openMenu': 'メニューを開く',
    'a11y.closeMenu': 'メニューを閉じる',
    'a11y.switchLang': '言語を切り替える',
    'a11y.contactFab': 'お問い合わせ',
    'a11y.footerNav': 'フッターナビゲーション',
    'footer.rightsReserved': '無断転載を禁じます。',

    'page.404.title': 'ページが見つかりませんでした。',
    'page.404.desc': 'URLが間違っているか、ページが移動した可能性があります。',
    'page.404.backHome': 'ホームへ戻る',

    'page.index.title': 'Webエンジニア ポートフォリオ',
    'page.index.description':
      'h-yoneのポートフォリオ — Salesforceとモダンweb開発が好きなWebエンジニア。',
    'page.index.hero.badge': 'Webエンジニア',
    'page.index.hero.heading': 'つくる、届ける、つなげる。',
    'page.index.hero.desc':
      'はじめまして、Yoneです！\n日々、Salesforceで業務システムを開発しながら、個人開発ではNext.js/TypeScriptでWebアプリをつくっています。\nIT技術の課題解決力に心惹かれ、日々研鑽を積んでいます。',
    'page.index.hero.available': '✔ 新しい挑戦を歓迎',
    'page.index.hero.profileImageAlt': 'プロフィール画像（プレースホルダー）',
    'page.index.skills.heading': '技術スキル',
    'page.index.skills.desc':
      '日常使いの技術スタック - エンタープライズ開発からモダンWeb、設計まで',
    'page.index.skills.frontend.title': 'Web開発',
    'page.index.skills.frontend.desc':
      'メインの技術スタックはNext.js、React、TypeScript。Tailwind CSSでレスポンシブなUIを組み立て、アイデアをシステムに落とし込むプロセス全体を楽しんでいます。',
    'page.index.skills.backend.title': 'Salesforceプラットフォーム',
    'page.index.skills.backend.desc':
      'Apex、LWC、Flowを使った業務アプリケーションの設計・開発。現在は、600名以上が毎日利用するCRMシステムの要件定義からリリースまで担当しています。',
    'page.index.skills.devops.title': '設計 & アーキテクチャ',
    'page.index.skills.devops.desc':
      'コードを書く前に「なぜ」を理解することを大切にしています。要件分析、仕様書作成、DB設計、テスト設計 — 保守性の高いシステムを作ることを常に心がけています。',
    'page.index.projects.heading': '主な実績',
    'page.index.projects.desc': '最近のプロジェクトや取り組みの紹介',
    'page.index.projects.coworker.badge': '個人開発',
    'page.index.projects.coworker.title': 'Coworker',
    'page.index.projects.coworker.desc1':
      '「どこで作業しよう？」そんな自分自身の悩みから生まれた、カフェやコワーキングスペースをマップで見つけて共有できるアプリ。',
    'page.index.projects.coworker.desc2':
      'Next.js、TypeScript、Prisma、MapLibreで構築。Wi-Fiや電源コンセントなどの設備条件で検索したり、お気に入りスポットを写真付きで投稿できます。',
    'page.index.projects.coworker.liveDemo': 'デモを見る',
    'page.index.projects.coworker.sourceCode': 'ソースコード',
    'page.index.projects.coworker.imageAlt': 'Coworker アプリのプレビュー画像',
    'page.index.projects.hakatamingle.badge': 'Webサイト支援',
    'page.index.projects.hakatamingle.title': '101 Hakatamingle',
    'page.index.projects.hakatamingle.desc1':
      '101 Hakatamingleは、新しい出会いと学びの場を提供する国際交流コミュニティ。定期的な交流イベントやBBQ、料理イベントなど、楽しみながら自然に英語に触れられる環境を整えています。',
    'page.index.projects.hakatamingle.desc2':
      'このコミュニティのWebサイトの運用支援を担当。自身も現場に立ち、現場の声を吸い上げることを大切にしています。',
    'page.index.projects.hakatamingle.visitSite': 'サイトを見る',
    'page.index.projects.hakatamingle.imageAlt': '101 Hakatamingle のプレビュー画像',
    'page.index.testimonials.heading': 'いただいた声',
    'page.index.testimonials.desc':
      '一緒にお仕事をした方々からのフィードバック',
    'page.index.testimonials.1.quote':
      'コードを書く前にビジネスの背景をしっかり理解してくれる、信頼できるエンジニアです。おかげでシステムは安定して稼働しています。',
    'page.index.testimonials.1.author': 'プロジェクトマネージャー',
    'page.index.testimonials.1.role': '業務システムプロジェクト',
    'page.index.testimonials.2.quote':
      '複雑な要件をきれいに整理して、わかりやすい設計に落とし込んでくれます。一緒に仕事がしやすいです。',
    'page.index.testimonials.2.author': 'チームリーダー',
    'page.index.testimonials.2.role': 'Salesforce開発',
    'page.index.testimonials.3.quote':
      '本当に必要なものを的確につくってくれました。コミュニケーションも取りやすく、レスポンスも早いです。',
    'page.index.testimonials.3.author': 'コミュニティ運営者',
    'page.index.testimonials.3.role': 'Webサイト支援',
    'page.index.testimonials.aria.1': 'お客様の声 1 へ',
    'page.index.testimonials.aria.2': 'お客様の声 2 へ',
    'page.index.testimonials.aria.3': 'お客様の声 3 へ',
    'page.index.cta.badge': 'つながる',
    'page.index.cta.heading': '一緒に何かつくりませんか？',
    'page.index.cta.desc':
      'プロジェクトのアイデア、SalesforceやWeb開発のご相談、または技術の話がしたい — そんなときはお気軽にご連絡ください。',
    'page.index.cta.available': '✔ 新しい挑戦・コラボレーション歓迎',

    'page.about.title': '自己紹介',
    'page.about.description': 'h-yoneの経歴、スキル、アプローチについて。',
    'page.about.hero.badge': 'Webエンジニア',
    'page.about.hero.heading': 'つくる、届ける、つなげる。',
    'page.about.hero.desc':
      'Salesforceで業務システムの開発に携わりながら、個人開発ではNext.js/TypeScriptでWebアプリをつくっているWebエンジニアです。',
    'page.about.hero.available': '✔ 新しい挑戦を歓迎',
    'page.about.hero.profileImageAlt': 'プロフィール画像（プレースホルダー）',
    'page.about.timeline.heading': '私の歩み',
    'page.about.timeline.desc':
      'これまでのキャリアと主なマイルストーンを時系列で紹介します。',
    'page.about.timeline.1.period': '2026年 – 現在',
    'page.about.timeline.1.title': '101 Hakatamingle',
    'page.about.timeline.1.subtitle': '福岡最大級の国際交流コミュニティ運営',
    'page.about.timeline.1.desc':
      'Webサイト運営。収益基盤の構築に向けたアプリケーション開発を担当。',
    'page.about.timeline.1.tags': 'Wix,Studio',
    'page.about.timeline.1.link1': 'Webサイト',
    'page.about.timeline.2.period': '2024年 – 現在',
    'page.about.timeline.2.title': '個人開発',
    'page.about.timeline.2.subtitle': 'アイデアを形にする',
    'page.about.timeline.2.desc': 'フルスタックのWebアプリケーション開発。',
    'page.about.timeline.2.tags':
      'Next.js,Astro,TypeScript,Supabase,Firebase,AWS',
    'page.about.timeline.2.link1': 'GitHub',
    'page.about.timeline.3.period': '2023年 – 現在',
    'page.about.timeline.3.title': 'Salesforceエンジニア',
    'page.about.timeline.3.subtitle': 'エンタープライズCRM開発',
    'page.about.timeline.3.desc':
      'ステークホルダーとの対話から課題を構造化。設計からリリースまでを完遂し、ビジネスの文脈に即したシステムを構築',
    'page.about.timeline.3.tags': 'Apex,LWC,Flow,SOQL',
    'page.about.aboutme.heading': '私について',
    'page.about.aboutme.body':
      '2001年生まれ、千葉県出身。現在は福岡を拠点に活動しています。\n技術力よりも「まず聞くこと」を大切にしていて、相手の課題に寄り添うことが良い仕事の第一歩だと思っています。\n気になることがあれば、お気軽にご連絡ください。',

    'page.contact.title': 'お問い合わせ',
    'page.contact.description': 'お気軽にお問い合わせください。',
    'page.contact.heading': 'お気軽にどうぞ！',
    'page.contact.desc':
      'お仕事のご依頼、技術的なご質問、またはちょっとしたご挨拶まで、お気軽にご連絡ください。通常24時間以内にご返信いたします。',
    'page.contact.form.name': 'お名前',
    'page.contact.form.email': 'メールアドレス',
    'page.contact.form.emailPlaceholder': 'taro@example.com',
    'page.contact.form.inquiryType': 'お問い合わせ種別',
    'page.contact.form.inquiryPlaceholder': '選択してください...',
    'page.contact.form.inquiryProject': 'プロジェクトのご相談',
    'page.contact.form.inquiryConsultation': '技術コンサルティング',
    'page.contact.form.inquiryChat': 'カジュアルな会話・ネットワーキング',
    'page.contact.form.inquiryOther': 'その他',
    'page.contact.form.message': 'メッセージ',
    'page.contact.form.send': '送信',
    'page.contact.form.sending': '送信中...',
    'page.contact.form.success':
      'ありがとうございます！メッセージが正常に送信されました。',
    'page.contact.form.error': 'エラーが発生しました。もう一度お試しください。',
    'page.contact.form.error.validation':
      '入力内容に問題があります。確認して再度お試しください。',
    'page.contact.form.error.turnstile':
      'セキュリティ認証に失敗しました。認証をやり直してください。',
    'page.contact.form.subject':
      'h-yone ポートフォリオサイトからのお問い合わせ',

    'page.privacy.title': 'プライバシーポリシー',
    'page.privacy.description': 'プライバシーポリシー。',
  },
} satisfies Record<Locale, Record<string, string>>;

type DictKey = keyof (typeof dict)['en'];

export function t(key: DictKey, locale: Locale): string {
  return dict[locale][key] ?? dict[defaultLocale][key] ?? String(key);
}
