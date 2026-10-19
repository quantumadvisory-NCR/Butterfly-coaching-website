/**
 * Launch content. Facts come from the existing BCA website (researched
 * October 2026) and are listed with their sources in docs/RESEARCH.md.
 * Everything here becomes editable in the admin once seeded; nothing on the
 * public site is hard-coded.
 *
 * Media is referenced by key (see seed/media.ts) as "@media:<key>" and is
 * swapped for the real media id when the seed runs.
 */

const m = (key: string) => `@media:${key}`;
const link = (label: string, href: string) => ({ label, href });
const NO_LINK = link("", "");

const BOOK = link("Book a discovery call", "booking");

/* -------------------------------------------------------------------------- */
/* Faculty                                                                    */
/* -------------------------------------------------------------------------- */

export const FACULTY = [
  {
    slug: "anup-mittal",
    name: "Anup Mittal",
    credential: "MCC (ICF)",
    roleTitle: "Founder, coach trainer and mentor",
    isFounder: true,
    photo: "person.anup-mittal",
    linkedinUrl: "https://www.linkedin.com/in/anupmittal/",
    shortBio:
      "Anup left a 16-year corporate career in 2018 to coach full time and founded Butterfly Coaching Academy in 2022. A Master Certified Coach, he is known for making complex coaching ideas simple through metaphor and story.",
    bioHtml:
      "<p>Anup Mittal is a Master Certified Coach (MCC) with the International Coaching Federation, an executive and leadership coach, and a coach trainer and mentor.</p>" +
      "<p>He is on a mission to simplify learning, so that even complex coaching frameworks are easy for anyone to grasp. After more than 16 years in corporate sales and marketing, he stepped away in 2018 to pursue coaching, and founded Butterfly Coaching Academy in 2022.</p>" +
      "<p>Anup has logged more than 4,100 hours of one-to-one coaching and has trained and mentored hundreds of coaches on their way to ACC, PCC and MCC credentials. He was born in Ajmer and lives in Jaipur with his family.</p>",
  },
  {
    slug: "kanika-vijai",
    name: "Kanika Vijai",
    credential: "PCC (ICF)",
    roleTitle: "Leadership and strengths coach",
    isFounder: false,
    photo: "person.kanika-vijai",
    linkedinUrl: "https://www.linkedin.com/in/kanikavijai/",
    shortBio:
      "Leadership and strengths coach with more than 900 hours of coaching experience and over 18 years in marketing and brand strategy. Gallup Global Strengths Coach.",
    bioHtml: "",
  },
  {
    slug: "vijay-srinivasan",
    name: "Vijay Srinivasan",
    credential: "PCC (ICF)",
    roleTitle: "Leadership transition coach",
    isFounder: false,
    photo: "person.vijay-srinivasan",
    linkedinUrl: null,
    shortBio:
      "Leadership transition coach with more than three decades of corporate experience, including as a Chief Operating Officer. Works with mid to senior level leaders on presence, confidence and career readiness.",
    bioHtml: "",
  },
  {
    slug: "sucheta-kulkarni",
    name: "Sucheta Kulkarni",
    credential: "PCC (ICF)",
    roleTitle: "Business, leadership and executive coach",
    isFounder: false,
    photo: "person.sucheta-kulkarni",
    linkedinUrl: "https://www.linkedin.com/in/sucheta-kulkarni-b58b57/",
    shortBio:
      "Business, leadership and executive coach and organisational development specialist, with 23 years of corporate experience and more than 8 years of professional coaching practice.",
    bioHtml: "",
  },
  {
    slug: "misk-khurana",
    name: "Misk Khurana",
    credential: "PCC (ICF)",
    roleTitle: "Productivity and performance coach",
    isFounder: false,
    photo: "person.misk-khurana",
    linkedinUrl: "https://www.linkedin.com/in/misk-khurana-79927713a/",
    shortBio:
      "Productivity and performance coach who helps high-capacity professionals turn priorities into consistent action, drawing on more than 10 years leading large-scale programmes.",
    bioHtml: "",
  },
];

/* -------------------------------------------------------------------------- */
/* Programmes                                                                 */
/* -------------------------------------------------------------------------- */

const LANGUAGES = "English, with Hindi support";
const CERT_FACULTY = ["anup-mittal", "kanika-vijai", "vijay-srinivasan", "sucheta-kulkarni"];

const certFaqs = (credential: string, level: string, education: string) => [
  {
    question: `How much coach education does the ${credential} programme include?`,
    answerHtml: `<p>${education}</p>`,
  },
  {
    question: `Does BCA award the ${credential} credential?`,
    answerHtml: `<p>BCA awards your programme certificate once you have completed your education, mentoring and evaluated practice. The ${credential} credential itself is awarded by the International Coaching Federation (ICF) when you meet its requirements and pass its credentialing exam.</p>`,
  },
  {
    question: "What language is the programme delivered in?",
    answerHtml: "<p>Primarily English, with Hindi support available.</p>",
  },
  {
    question: `When does the next ${level} cohort start, and what does it cost?`,
    answerHtml:
      '<p>Cohort dates and fees are shared when you speak with us. <a href="/contact-us/?intent=discovery_call#enquire">Request a discovery call</a> or send an enquiry and we will send you the current schedule.</p>',
  },
];

export const PROGRAMMES = [
  {
    slug: "level-1-acc",
    path: "/level-1-acc-coach-program/",
    kind: "certification" as const,
    name: "Level 1: ACC Coach Programme",
    levelLabel: "Level 1",
    credential: "ACC",
    tagline: "A strong professional foundation and the beginning of your identity as a coach.",
    summary: "Build the fundamentals of ethical, competency-based coaching through learning labs, practice labs and mentor coaching.",
    descriptionHtml:
      "<p>The ACC programme is the first stage in a coach's professional journey. It builds a foundation in ethical, competency-based coaching with one aim: that you become a capable coach, not someone who has simply completed hours.</p>" +
      "<p>You will learn to hold presence rather than give advice, to listen with discipline, and to treat coaching as a way of being as much as a set of skills. Certification is awarded only after education, mentoring and evaluated practice.</p>",
    audience: [
      "Aspiring professional coaches",
      "People managers and leaders who want to coach their teams",
      "Professionals who work closely with people and stakeholders",
      "Anyone committed to developing others",
    ],
    eligibility: ["A commitment to learning and practising with integrity", "Readiness to coach real clients as part of your development"],
    outcomes: [
      "Deep listening",
      "Powerful questioning",
      "Creating awareness",
      "Ethical, effective coaching partnerships",
      "A working grounding in the ICF Core Competencies and ethical practice",
      "Readiness for ACC performance evaluation and the ICF credentialing exam",
    ],
    highlights: [
      "77 hours of ICF Level 1 accredited coach education",
      "Small cohort learning",
      "Integrated learning labs and practice labs",
      "Continuous mentor coaching and competency-based feedback",
      "Performance evaluation through coaching call review",
      "Delivered in English, with Hindi support",
    ],
    educationHours: "77",
    mentoringHours: "10",
    experienceHours: 75,
    languages: LANGUAGES,
    accreditationStatus: "accredited" as const,
    badge: "icf.level-1",
    heroImage: "photo.programme-acc-learning-lab",
    cardImage: "photo.programme-acc-learning-lab",
    isFeatured: true,
    seoTitle: "Level 1 ACC Coach Programme: ICF accredited coach training",
    seoDescription:
      "77 hours of ICF Level 1 accredited coach education with learning labs, practice labs and mentor coaching. The foundation for your ACC credential.",
    faculty: CERT_FACULTY,
    modules: [
      { title: "Enrol and orient", description: "Join your cohort and get ready for the journey ahead.", hoursLabel: null },
      { title: "Learning Lab", description: "Coach education that builds awareness of coaching principles, the ICF Core Competencies and the coaching mindset.", hoursLabel: "77 hours" },
      { title: "Practice Lab", description: "Apply what you learn in real conversations, with close observation, reflection, feedback and guided practice.", hoursLabel: null },
      { title: "Mentoring and feedback", description: "Reflect on your own coaching conversations with a mentor coach, against ICF competency markers.", hoursLabel: "10 hours" },
      { title: "Coaching experience", description: "Coach real clients and build your experience hours.", hoursLabel: "75 hours" },
      { title: "Performance evaluation", description: "Your coaching call is reviewed against ACC-level markers. BCA awards your certificate.", hoursLabel: null },
      { title: "ICF ACC credential exam", description: "Sit the ICF credentialing exam to earn your ACC credential.", hoursLabel: null },
    ],
    faqs: certFaqs("ACC", "Level 1", "77 hours of ICF Level 1 accredited coach education, alongside 10 hours of mentoring and feedback."),
  },
  {
    slug: "level-2-pcc",
    path: "/level-2-pcc-coach-program/",
    kind: "certification" as const,
    name: "Level 2: PCC Coach Programme",
    levelLabel: "Level 2",
    credential: "PCC",
    tagline: "Deep mastery and integration in your coaching practice.",
    summary: "For coaches who have completed foundational training and want more depth, presence and consistency.",
    descriptionHtml:
      "<p>The PCC programme is the second stage of a coach's professional journey. It is for coaches who have completed foundational ACC education and want to deepen their practice, presence and professional mastery.</p>" +
      "<p>The work moves beyond doing coaching: relating to the client's world, staying present with complexity and uncertainty, and evoking awareness that changes action and identity. Progression is based on demonstrated capability.</p>",
    audience: [
      "Coaches who have completed ACC training and are working toward professional mastery",
      "Practising coaches who want more presence, consistency and confidence",
      "Coaches preparing for PCC credentialing",
      "Leaders and practitioners using coaching at a deeper professional or organisational level",
    ],
    eligibility: ["Completion of an ACC-level coach education pathway", "An active coaching practice"],
    outcomes: [
      "Embodying the ICF Core Competencies",
      "Refined presence, judgement and partnership",
      "Working with complexity, uncertainty and evolving client agendas",
      "Readiness for PCC performance evaluation and the ICF credentialing exam",
    ],
    highlights: [
      "140 hours of ICF Level 2 accredited coach education",
      "Small cohort learning with a community of peers",
      "Advanced learning labs and deep practice labs",
      "Mentor coaching aligned with PCC markers",
      "A continuously evolving curriculum",
      "Delivered in English, with Hindi support",
    ],
    educationHours: "140",
    mentoringHours: "10",
    experienceHours: 500,
    languages: LANGUAGES,
    accreditationStatus: "accredited" as const,
    badge: "icf.level-2",
    heroImage: "photo.programme-pcc-deep-practice",
    cardImage: "photo.programme-pcc-deep-practice",
    isFeatured: true,
    seoTitle: "Level 2 PCC Coach Programme: ICF accredited coach training",
    seoDescription:
      "140 hours of ICF Level 2 accredited coach education for coaches ready to deepen their practice and prepare for the PCC credential.",
    faculty: CERT_FACULTY,
    modules: [
      { title: "Entry and readiness alignment", description: "We confirm you have completed an ACC-level pathway and are ready for deeper work.", hoursLabel: null },
      { title: "Advanced Learning Lab", description: "Advanced coach education in the depth and integration that PCC-level coaching asks for.", hoursLabel: "140 hours" },
      { title: "Deep Practice Lab", description: "Sustained practice with observation, reflection and feedback.", hoursLabel: null },
      { title: "Mentor coaching and reflective feedback", description: "Mentor coaching aligned with PCC markers.", hoursLabel: "10 hours" },
      { title: "Coaching experience", description: "Coaching experience with real clients.", hoursLabel: "500 hours" },
      { title: "Performance evaluation", description: "A PCC call review. BCA awards your certificate.", hoursLabel: null },
      { title: "ICF PCC credential exam", description: "Sit the ICF credentialing exam to earn your PCC credential.", hoursLabel: null },
    ],
    faqs: certFaqs("PCC", "Level 2", "140 hours of ICF Level 2 accredited coach education, alongside 10 hours of mentor coaching."),
  },
  {
    slug: "level-3-mcc",
    path: "/level-3-mcc-program/",
    kind: "certification" as const,
    name: "Level 3: MCC Programme",
    levelLabel: "Level 3",
    credential: "MCC",
    tagline: "Mastery-level presence and contribution, built over a long arc of practice.",
    summary: "A long-term developmental journey for experienced coaches working toward mastery.",
    descriptionHtml:
      "<p>The MCC programme is for experienced coaches pursuing the highest level of professional coaching mastery. It is a long-term developmental journey, and the learning is spacious, reflective and demanding.</p>" +
      "<p>At this level the coach's presence becomes the intervention. Subtle shifts create deep movement, and the coach can hold complexity without rushing to resolve it.</p>",
    audience: [
      "Coaches holding a PCC credential or equivalent education",
      "Senior coaches with substantial coaching experience",
      "Coaches committed to mastery and long-term professional contribution",
      "Practitioners working at depth with complex clients and systems",
    ],
    eligibility: ["Completion of a PCC-level coach education pathway"],
    outcomes: [
      "Refined coaching presence, discernment and judgement",
      "Mastery of timing, awareness and relational depth",
      "Mastery-level embodiment of the ICF Core Competencies",
      "A deepened sense of ethical responsibility",
    ],
    highlights: [
      "95 hours of ICF Level 3 accredited coach education",
      "Small cohort learning",
      "Mastery learning labs and practice labs",
      "High-touch advanced mentor coaching",
      "Performance evaluation against MCC-level markers",
      "Delivered in English, with Hindi support",
    ],
    educationHours: "95",
    mentoringHours: null,
    experienceHours: 2500,
    languages: LANGUAGES,
    // The old site was inconsistent about Level 3 accreditation. The owner
    // confirmed on 10 October 2026 that BCA holds it. See docs/CONTENT_APPROVAL_CHECKLIST.md.
    accreditationStatus: "accredited" as const,
    badge: "icf.level-3",
    heroImage: "photo.programme-mcc-mastery",
    cardImage: "photo.programme-mcc-mastery",
    isFeatured: true,
    seoTitle: "Level 3 MCC Programme: ICF accredited coach training",
    seoDescription:
      "95 hours of ICF Level 3 accredited coach education for experienced coaches working toward the Master Certified Coach (MCC) credential.",
    faculty: ["anup-mittal"],
    modules: [
      { title: "Entry and mastery readiness", description: "We confirm you have completed a PCC-level pathway and are ready for mastery-level work.", hoursLabel: null },
      { title: "Mastery Learning Lab", description: "Coach education focused on presence, discernment and depth.", hoursLabel: "95 hours" },
      { title: "Mastery Practice Lab", description: "Practice at depth, with observation and reflection.", hoursLabel: null },
      { title: "Advanced mentor coaching", description: "High-touch mentor coaching for mastery-level development.", hoursLabel: null },
      { title: "Extensive coaching experience", description: "Professional coaching experience with real clients.", hoursLabel: "2,500 hours" },
      { title: "Performance evaluation", description: "An MCC call review: your conversations are assessed against MCC-level markers. BCA awards your certificate.", hoursLabel: null },
      { title: "ICF MCC credential exam", description: "Sit the ICF credentialing exam to earn your MCC credential.", hoursLabel: null },
    ],
    faqs: certFaqs("MCC", "Level 3", "95 hours of ICF Level 3 accredited coach education, with advanced mentor coaching throughout."),
  },
  {
    slug: "mentoring-supervision",
    path: "/services/mentor-coaching-supervision/",
    kind: "service" as const,
    name: "Mentoring and Supervision",
    levelLabel: null,
    credential: null,
    tagline: "Deepen your practice and meet ICF requirements.",
    summary: "One-to-one mentor coaching for ICF credentialing, and reflective supervision for practising coaches.",
    descriptionHtml: "",
    audience: [],
    eligibility: [],
    outcomes: [],
    highlights: [],
    educationHours: null,
    mentoringHours: null,
    experienceHours: null,
    languages: null,
    accreditationStatus: "not_applicable" as const,
    badge: null,
    heroImage: "photo.mentoring-session-review",
    cardImage: "photo.mentoring-session-review",
    isFeatured: true,
    seoTitle: null,
    seoDescription: null,
    faculty: [],
    modules: [],
    faqs: [],
  },
  {
    slug: "corporate-programmes",
    path: "/services/corporate-programs/",
    kind: "corporate" as const,
    name: "Corporate Programmes",
    levelLabel: null,
    credential: null,
    tagline: "Leadership development for organisations.",
    summary: "Manager as a Coach, Leader as a Coach, Power of Presence and bespoke leadership journeys.",
    descriptionHtml: "",
    audience: [],
    eligibility: [],
    outcomes: [],
    highlights: [],
    educationHours: null,
    mentoringHours: null,
    experienceHours: null,
    languages: null,
    accreditationStatus: "not_applicable" as const,
    badge: null,
    heroImage: "photo.corporate-leadership-workshop",
    cardImage: "photo.corporate-leadership-workshop",
    isFeatured: true,
    seoTitle: null,
    seoDescription: null,
    faculty: [],
    modules: [],
    faqs: [],
  },
  {
    slug: "individual-executive-coaching",
    path: "/services/coaching-services/",
    kind: "service" as const,
    name: "Individual and Executive Coaching",
    levelLabel: null,
    credential: null,
    tagline: "One-to-one coaching partnerships.",
    summary: "One-to-one coaching for clarity, growth and conscious action: life, executive, career, productivity and business coaching.",
    descriptionHtml: "",
    audience: [],
    eligibility: [],
    outcomes: [],
    highlights: [],
    educationHours: null,
    mentoringHours: null,
    experienceHours: null,
    languages: null,
    accreditationStatus: "not_applicable" as const,
    badge: null,
    heroImage: "photo.executive-coaching-walk",
    cardImage: "photo.executive-coaching-walk",
    isFeatured: false,
    seoTitle: null,
    seoDescription: null,
    faculty: [],
    modules: [],
    faqs: [],
  },
];

/* -------------------------------------------------------------------------- */
/* Testimonials: verbatim from butterflycoachingacademy.com/testimonial/       */
/* -------------------------------------------------------------------------- */

const SOURCE_NOTE = "Published on the existing BCA website (/testimonial/). Reconfirm consent and spelling of the name before launch.";

export const TESTIMONIALS = [
  {
    name: "Dr. Supriya Dhongde",
    roleTitle: "Executive Coach and Psychologist",
    photo: "person.supriya-dhongde",
    isFeatured: true,
    quote:
      "I am a firm believer that in order to be an effective coach, you keep challenging your own beliefs and patterns in order to be the same with clients. Anup was the right choice as he gave us the comfort that he is one of us and not the master coach. He was open to learning from all of us, ready to accept his challenges and made an absolutely safe space for us to be our real self.",
    excerpt: "He was open to learning from all of us, ready to accept his challenges and made an absolutely safe space for us to be our real self.",
  },
  {
    name: "Naved Narayan",
    photo: "person.naved-narayan",
    isFeatured: true,
    quote:
      "The program has strong foundation based on ICF Competencies. Plus BCA brings it’s iKAN – a wholistic framework. Additionally, BCA has stitched together new elements such as clean language to provide an enriching learning experience. The hands-on learning labs makes it experiential. Anup makes himself available always, be it additional group sessions or a one-on-one mentoring calls.",
    excerpt: "The hands-on learning labs makes it experiential. Anup makes himself available always, be it additional group sessions or a one-on-one mentoring calls.",
  },
  {
    name: "Mrinal Bafna",
    photo: "person.mrinal-bafna",
    isFeatured: true,
    quote:
      "My Journey with Butterfly coaching academy has been transformational. Being a practicing coach, I thought I knew it all. But understanding the nuances of ICF standards and applying it in my work has provided some remarkable results. I am 100% more confident to take on uncertainties with my client and my feedback has improved drastically",
    excerpt: "Being a practicing coach, I thought I knew it all. But understanding the nuances of ICF standards and applying it in my work has provided some remarkable results.",
  },
  {
    name: "Cecilla Fretias",
    photo: "person.cecilla-fretias",
    programme: "level-1-acc",
    quote:
      "My journey with Butterfly Coaching Academy has been truly transformative. The unique teaching approach, led by Coach Anup, breaks down complex concepts into relatable examples, making learning both accessible and effective. Through the ACC program, I not only gained essential coaching skills but also underwent significant personal growth. Mastering competencies like active listening, being fully present, powerful questioning, and evoking awareness not only honed my communication but also deepened my empathy.",
  },
  {
    name: "Sandeep Chugh",
    photo: "person.sandeep-chugh",
    quote:
      "I found Anup displayed a deep sense of commitment towards our learning as participants during the program and helped support us in various ways. Anup helped me raise my confidence in my coaching besides giving me feedback on various areas of Improvement as a part of the mentoring during the program.",
  },
  {
    name: "Rajendra Pratap Singh",
    photo: "person.rajendra-pratap-singh",
    quote:
      "This course not only delivers the ICF competencies-related aspects but also focuses on the overall development and growth of individuals. A couple of concepts, apart from the ICF competencies introduced by Anup, like Sawubona, Tatvam Asi, indirect learning, iKAN, clean language, etc., have opened up a lot of things for me. The practical labs, followed by the learning labs, gave us a good hands-on experience of being a coach in a coaching conversation.",
  },
  {
    name: "Kanika Vijai",
    roleTitle: "Corporate Relations Advisor",
    photo: "person.kanika-vijai",
    quote:
      "All the nuances and concepts were explained with simplicity which not only made it easy to understand but also implement it in real life. What stood out for me is the storytelling technique and usage of metaphors which generated higher interest in me and is helping me retain these learning for a longer time.",
  },
  {
    name: "Vijay Srinivasan",
    roleTitle: "COO",
    photo: "person.vijay-srinivasan",
    quote:
      "What sets Anup apart is not just his expertise, but his extraordinary patience and dedication to ensuring each one of us grasps the nuances of coaching effectively. He is always willing to lend a helping hand, exemplifying the philosophy that “collectively we grow”. Whether it’s a group session or a one-on-one call, Anup is there to offer deeper insights and make sure no one is left behind.",
  },
  {
    name: "Anup Nayar",
    photo: "person.anup-nayar",
    quote:
      "The personal beliefs and values which Anup stands for I am sure will make BCA a world class coaching institution which prides itself on high quality pedagogy, enriched with simplicity and ease of learning. My learning stint with BCA continues to be a journey of self-exploration and steeped in continuous learning making my objective of becoming a coach an wholesome outcome.",
  },
  {
    name: "Anju Nayar",
    photo: "person.anju-nayar",
    quote:
      "Butterfly Coaching Academy has taught me to spread my wings and explore myself emotionally, mentally and spiritually in enriching my coaching skills. Anup for me personally has been a very genuine human being who has always inspired me to strive for excellence in every aspect of my coaching competency learning and practice.",
  },
  {
    name: "Nand Kishore",
    photo: "person.nand-kishore",
    quote:
      "After joining this Cohort I can see tremendous shift in myself. It helped me to change my perspective to be non judgemental & curious to know about my training participants. My listening and probing skills have been improved due to the session.",
  },
  {
    name: "Harshita Sehgal",
    quote:
      "The course chosen by coach Anup was well placed for some-one beginning the coaching journey but the best part remains Coach Anup’s enthusiasm and style of explaining each and every aspect with such suitable & relatable examples.",
  },
].map((t) => ({ sourceNote: SOURCE_NOTE, roleTitle: null, photo: null, programme: null, isFeatured: false, excerpt: null, ...t }));

/* -------------------------------------------------------------------------- */
/* FAQs                                                                       */
/* -------------------------------------------------------------------------- */

export const FAQS: { group: string; question: string; answerHtml: string }[] = [
  {
    group: "home",
    question: "Which programme is right for me?",
    answerHtml:
      '<p>It depends on your stage of practice, your readiness to learn and the credential you are working toward. Level 1 leads toward ACC, Level 2 toward PCC and Level 3 toward MCC. If you are unsure, <a href="/contact-us/?intent=discovery_call#enquire">request a discovery call</a> and we will help you choose.</p>',
  },
  {
    group: "home",
    question: "Who can become a coach?",
    answerHtml:
      "<p>Anyone who is committed to learning and to practising with integrity. Our learners include aspiring professional coaches, managers and leaders, HR and L&amp;D professionals, facilitators and educators.</p>",
  },
  {
    group: "home",
    question: "Is coach training only for people who want to coach full time?",
    answerHtml:
      "<p>No. Coaching skills are used every day in leadership, HR, facilitation and education. Many people join to lead and develop others better in the role they already have.</p>",
  },
  {
    group: "home",
    question: "What makes BCA different?",
    answerHtml:
      "<p>Learning here is applied. You learn in learning labs, practise in practice labs, receive mentor coaching and feedback, and return to what you have learnt. We believe readiness matters more than certificates.</p>",
  },
  {
    group: "home",
    question: "What format and language are the programmes in?",
    answerHtml:
      "<p>Programmes run in small cohorts and are delivered primarily in English, with Hindi support. Ask us about the schedule and delivery format for the next cohort.</p>",
  },
  {
    group: "home",
    question: "How do I enquire or enrol?",
    answerHtml:
      '<p>Request a discovery call, send an enquiry through the <a href="/contact-us/">contact form</a>, or message us on WhatsApp. We will talk through your goals, answer your questions and share current dates and fees.</p>',
  },
  {
    group: "programmes",
    question: "What is the difference between ACC, PCC and MCC?",
    answerHtml:
      "<p>They are the three credential levels of the International Coaching Federation (ICF). ACC is the foundation, PCC adds depth and integration, and MCC is mastery. Each level asks for more coach education and more coaching experience than the one before.</p>",
  },
  {
    group: "programmes",
    question: "Who awards the credential?",
    answerHtml:
      "<p>BCA awards your programme certificate after education, mentoring and evaluated practice. The credential itself is awarded by ICF once you meet its requirements and pass its credentialing exam.</p>",
  },
  {
    group: "programmes",
    question: "Which level should I start with?",
    answerHtml:
      "<p>Level 1 is the starting point if you are new to professional coach training. Level 2 follows an ACC-level pathway, and Level 3 follows a PCC-level pathway. If you have trained elsewhere, talk to us and we will help you find the right entry point.</p>",
  },
  {
    group: "programmes",
    question: "Can I get mentor coaching without joining a full programme?",
    answerHtml:
      '<p>Yes. One-to-one mentor coaching is available for ACC, PCC and MCC credential applications. See <a href="/services/mentor-coaching-supervision/">Mentoring and Supervision</a>.</p>',
  },
  {
    group: "programmes",
    question: "What are the fees and cohort dates?",
    answerHtml:
      '<p>We share current fees and dates when you speak with us, so the information you receive is always up to date. <a href="/contact-us/?intent=discovery_call#enquire">Request a discovery call</a> to get the latest schedule.</p>',
  },
  {
    group: "mentoring",
    question: "Is mentor coaching one-to-one or in a group?",
    answerHtml: "<p>Engagements are one-to-one and personalised. They are not generic or group based.</p>",
  },
  {
    group: "mentoring",
    question: "Which ICF credentials do you support?",
    answerHtml: "<p>ACC, PCC and MCC, on both the traditional and the updated ICF pathways.</p>",
  },
  {
    group: "mentoring",
    question: "What is the difference between mentor coaching and supervision?",
    answerHtml:
      "<p>Mentor coaching is focused preparation for an ICF credential: it looks at your coaching against the ICF Core Competencies. Supervision is an ongoing reflective space for practising coaches to examine their work, patterns, challenges and ethical questions.</p>",
  },
  {
    group: "corporate",
    question: "Can a programme be tailored to our organisation?",
    answerHtml:
      "<p>Yes. Every programme is designed around your context rather than delivered as a one-size-fits-all solution. Programmes can run on their own or be combined into a longer leadership journey.</p>",
  },
  {
    group: "corporate",
    question: "How do we get started?",
    answerHtml:
      "<p>Send us a corporate enquiry or request a discovery call. We start by learning about your context, your challenges and what you want to achieve, and then design something relevant and sustainable.</p>",
  },
  {
    group: "corporate",
    question: "Who are the programmes for?",
    answerHtml:
      "<p>Senior leaders and executives, leadership teams navigating growth and change, organisations building internal coaching capability, and HR and L&amp;D teams driving leadership and culture initiatives.</p>",
  },
];

/* -------------------------------------------------------------------------- */
/* Pages                                                                      */
/* -------------------------------------------------------------------------- */

type Section = { type: string; data: Record<string, unknown> };
type PageSeed = {
  path: string;
  title: string;
  seoTitle?: string;
  seoDescription: string;
  noindex?: boolean;
  sections: Section[];
};

const FOUNDER_FACTS = [
  { value: "MCC", label: "Master Certified Coach, ICF" },
  { value: "4,100+", label: "hours of one-to-one coaching" },
  { value: "24+", label: "years of professional experience" },
];

/* The homepage's top half (hero, pathways, figures) and its FAQ. Shared with
   scripts/upgrade-homepage.ts, which brings the live homepage up to this layout. */
export const HOME_HERO = {
  variant: "home",
  // The accreditation wording and the proof points are flagged for owner verification in docs/CONTENT_APPROVAL_CHECKLIST.md.
  eyebrow: "ICF-accredited coach education · India",
  heading: "Learning that stays.",
  headingAccent: "Coaching that transforms.",
  subheading: "ICF-accredited coach training built on practice, spaced review and founder mentoring.",
  primaryCta: BOOK,
  secondaryCta: link("Explore programmes", "/coaching-certifications/"),
  chips: [
    { label: "ICF-accredited", icon: "seal" },
    { label: "Founded by Anup Mittal, MCC", icon: "person" },
    { label: "4,100+ hours of founder coaching", icon: "clock" },
  ],
  trustText: "Join coaches learning through practice, reflection and feedback.",
  trustPhotos: true,
  // Authentic BCA photograph: Anup Mittal with learners around a practice table.
  image: m("gallery.anup-with-table-group"),
  imageTall: null,
  imageFocus: "left",
  credentialValue: "Anup Mittal, MCC",
  credentialLabel: "Master Certified Coach, ICF",
};

export const HOME_PATHS = {
  layout: "panel",
  heading: "Choose your path",
  intro: "Three ways to work with us, depending on where you are headed.",
  items: [
    {
      title: "Become a Coach",
      body: "ACC, PCC and MCC pathways",
      link: link("Explore coach training", "/coaching-certifications/"),
      icon: "cap",
      image: m("photo.path-become-a-coach"),
    },
    {
      title: "Grow as a Leader",
      body: "Coaching skills for HR, L&D and managers",
      link: link("Start with Level 1", "/level-1-acc-coach-program/"),
      icon: "trend",
      image: m("photo.path-grow-as-a-leader"),
    },
    {
      title: "Develop your Organisation",
      body: "Corporate coaching and leadership programmes",
      link: link("See corporate programmes", "/services/corporate-programs/"),
      icon: "buildings",
      image: m("photo.path-develop-your-organisation"),
    },
  ],
};

/** Verified figures only. "Coaches trained" and "Organisations partnered" stay empty, and so hidden, until the owner confirms them. */
export const HOME_STATS = {
  heading: "Butterfly Coaching Academy in figures",
  showHeading: false,
  items: [
    { value: "4,100", prefix: "", suffix: "+", label: "Hours of one-to-one coaching by our founder", countUp: true },
    { value: "3", prefix: "", suffix: "", label: "ICF credential pathways: ACC, PCC and MCC", countUp: true },
    { value: "24", prefix: "", suffix: "+", label: "Years of professional experience behind our founder", countUp: true },
    { value: "2022", prefix: "", suffix: "", label: "Founded by Anup Mittal, MCC", countUp: false },
    { value: "", prefix: "", suffix: "+", label: "Coaches trained", countUp: true },
    { value: "", prefix: "", suffix: "", label: "Organisations partnered", countUp: true },
  ],
};

export const HOME_FAQ = {
  heading: "Questions, answered.",
  intro: "Straight answers on programmes, eligibility, formats and how to enquire. If you are still deciding, we will help you choose.",
  group: "home",
  helpHeading: "Still unsure? Talk to us.",
  helpText: "A short conversation is often the quickest way to find the programme that fits where you are headed.",
  cta: BOOK,
};

const closingCta = (heading = "Ready to find your next step?"): Section => ({
  type: "cta",
  data: {
    heading,
    body: "Talk it through with us. A short conversation is often the quickest way to find the right programme.",
    primaryCta: BOOK,
    secondaryCta: link("WhatsApp us", "whatsapp"),
  },
});

export const PAGES: PageSeed[] = [
  {
    path: "/",
    title: "Home",
    seoTitle: "Butterfly Coaching Academy: ICF-accredited coach training in India",
    seoDescription:
      "Learning that stays. ICF-accredited coach training built on practice, spaced review and founder mentoring. ACC, PCC and MCC pathways, mentoring and corporate programmes.",
    sections: [
      {
        type: "hero",
        data: HOME_HERO,
      },
      {
        type: "path_cards",
        data: HOME_PATHS,
      },
      {
        type: "stats",
        data: HOME_STATS,
      },
      {
        type: "trust_strip",
        data: {
          heading: "ICF-accredited coach education",
          logos: [
            { image: m("icf.level-1"), name: "ICF Level 1 accredited coaching education" },
            { image: m("icf.level-2"), name: "ICF Level 2 accredited coaching education" },
            { image: m("icf.level-3"), name: "ICF Level 3 accredited coaching education" },
          ],
          facts: [],
        },
      },
      {
        type: "feature_list",
        data: {
          background: "cream",
          heading: "Why learners choose BCA",
          intro: "Coach training should change how you work, not only what you know.",
          items: [
            {
              title: "Learning that stays",
              body: "You meet an idea, use it with real clients, then come back to it with experience. Returning to what you have learnt is what makes it last.",
            },
            {
              title: "The iKAN framework",
              body: "Our own coaching methodology: Identify the real need, explore the Known and unknown, choose an Alternate path, then take Action and repeat.",
            },
            {
              title: "Practice, reflection and mentoring",
              body: "Learning labs build understanding. Practice labs, mentor coaching and competency-based feedback build capability.",
            },
          ],
          image: m("photo.practice-feedback"),
          cta: link("How we teach", "/about-us/"),
        },
      },
      {
        type: "programme_cards",
        data: {
          heading: "Explore programmes",
          intro: "ICF credential pathways, mentoring for working coaches, and programmes for organisations.",
          source: "featured",
          cta: link("Compare the pathways", "/coaching-certifications/#compare"),
        },
      },
      {
        type: "timeline",
        data: {
          background: "cream",
          heading: "The learning journey",
          intro: "Every programme follows the same rhythm, so each skill builds on the last.",
          steps: [
            { marker: "", title: "Learn", body: "Learning labs introduce coaching principles, competencies and mindset." },
            { marker: "", title: "Practise", body: "Practice labs put ideas to work in real coaching conversations." },
            { marker: "", title: "Receive feedback", body: "Mentor coaches and peers give specific, competency-based feedback." },
            { marker: "", title: "Reflect and revisit", body: "You return to earlier ideas with new experience, and they deepen." },
            { marker: "", title: "Build capability", body: "Evaluated practice shows you are ready for your credential." },
          ],
        },
      },
      {
        type: "profiles",
        data: {
          heading: "Meet the founder",
          intro: "",
          source: "founder",
          facts: FOUNDER_FACTS,
          cta: link("About BCA", "/about-us/"),
        },
      },
      {
        type: "testimonials",
        data: {
          background: "cream",
          heading: "Student stories",
          intro: "What learning with BCA is like, in our learners' own words.",
          source: "featured",
          limit: 4,
          cta: link("Read more student stories", "/testimonial/"),
        },
      },
      {
        type: "faq",
        data: HOME_FAQ,
      },
      closingCta(),
    ],
  },

  {
    path: "/coaching-certifications/",
    title: "Programmes",
    seoTitle: "Coach training programmes: ICF ACC, PCC and MCC pathways",
    seoDescription:
      "Compare BCA's ICF credential pathways for ACC, PCC and MCC, plus mentoring and supervision, individual coaching and corporate programmes.",
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "ICF credential pathways",
          heading: "Programmes for every stage of your coaching journey",
          subheading:
            "ACC, PCC and MCC pathways grounded in the ICF Core Competencies, with mentoring for working coaches and programmes for organisations.",
          primaryCta: BOOK,
          secondaryCta: link("Compare the pathways", "#compare"),
          image: m("photo.programme-acc-learning-lab"),
          imageTall: null,
        },
      },
      {
        type: "programme_cards",
        data: {
          heading: "Find your programme",
          intro: "Credentials matter, but you have to become capable to earn them. Each pathway is built around that idea.",
          source: "all",
          cta: NO_LINK,
        },
      },
      {
        type: "comparison_table",
        data: {
          background: "cream",
          anchor: "compare",
          heading: "Compare the ICF pathways",
          intro: "From foundation to depth to mastery.",
          source: "programmes",
          columns: [],
          rows: [],
          footnote:
            "Coach education and mentor coaching hours are for BCA programmes. Coaching experience is what you build with real clients on the way to each credential. We confirm current ICF requirements with you before you enrol.",
        },
      },
      {
        type: "timeline",
        data: {
          heading: "The iKAN framework",
          intro: "Developed from our work with clients, iKAN gives a coaching conversation its shape. It also shapes how we teach.",
          steps: [
            { marker: "i", title: "Identify", body: "Slow down and uncover the real need, not the symptoms." },
            { marker: "K", title: "Known and unknown", body: "Surface assumptions, patterns, inner conflicts and unspoken truths." },
            { marker: "A", title: "Alternate path", body: "Separate meaningful action from busy action and choose the best course." },
            { marker: "N", title: "Action and repeat", body: "Turn insight into practice through repetition, and build momentum." },
          ],
        },
      },
      {
        type: "feature_list",
        data: {
          background: "cream",
          heading: "How we build real capability",
          intro: "Coaching is built through practice, observation, reflection and lived experience, not theory alone.",
          items: [
            { title: "Learning Lab", body: "Builds awareness of coaching principles, competencies and mindset." },
            { title: "Practice Lab", body: "Real conversations with close observation, reflection, feedback and guided practice." },
            { title: "Mentoring", body: "One-to-one reflection on your coaching conversations, against ICF competency markers." },
            { title: "Credentialing preparation", body: "Preparation for ICF performance evaluation and the exam, with a focus on professional standards and integrity." },
          ],
          image: m("photo.cohort-community"),
          cta: NO_LINK,
        },
      },
      {
        type: "faq",
        data: {
          heading: "Programme questions",
          intro: "",
          group: "programmes",
          cta: link("Contact us", "/contact-us/"),
        },
      },
      closingCta("Not sure which pathway fits?"),
    ],
  },

  {
    path: "/services/mentor-coaching-supervision/",
    title: "Mentoring and Supervision",
    seoTitle: "Mentor coaching and supervision for ICF credentials",
    seoDescription:
      "One-to-one mentor coaching for ACC, PCC and MCC credential applications, and reflective supervision for practising coaches.",
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "",
          heading: "Mentor coaching and supervision",
          subheading: "One-to-one support for coaches preparing for an ICF credential, and a reflective space for coaches in practice.",
          primaryCta: BOOK,
          secondaryCta: link("Send an enquiry", "#enquire"),
          image: m("photo.mentoring-session-review"),
          imageTall: null,
        },
      },
      {
        type: "image_text",
        data: {
          heading: "Mentor coaching for ICF credentialing",
          body: "<p>Focused support for coaches applying for an ICF credential, or working to align their coaching with the ICF Core Competencies. Available for ACC, PCC and MCC, on both the traditional and the updated ICF pathways.</p>",
          bullets: [
            "Coaches who need mentor coaching hours for a credential application",
            "Coaches preparing specific calls for ICF submission",
            "Coaches moving between credential levels",
          ],
          cta: NO_LINK,
          image: m("photo.practice-feedback"),
          imageSide: "right",
        },
      },
      {
        type: "image_text",
        data: {
          background: "cream",
          heading: "Supervision for practising coaches",
          body: "<p>An ongoing reflective space to look at your work, your patterns and your challenges, and to think through ethical questions with an experienced coach.</p>",
          bullets: ["Examine your practice", "Explore ethical dilemmas", "Notice patterns in your client work", "Build self-awareness and resilience"],
          cta: NO_LINK,
          image: m("photo.programme-mcc-mastery"),
          imageSide: "left",
        },
      },
      {
        type: "timeline",
        data: {
          heading: "How mentor coaching works",
          intro: "Every engagement is one-to-one and personal.",
          steps: [
            { marker: "", title: "Initial assessment", body: "A detailed review of your coaching recordings to see where you are now and where you can grow." },
            { marker: "", title: "Your development plan", body: "A focused plan, created together, around your growth areas and credentialing requirements." },
            { marker: "", title: "Practice and feedback", body: "Regular one-to-one sessions with specific, actionable feedback." },
            { marker: "", title: "Credential preparation", body: "Support in preparing your coaching calls for ICF submission." },
          ],
        },
      },
      { type: "faq", data: { background: "cream", heading: "Mentoring questions", intro: "", group: "mentoring", cta: NO_LINK } },
      {
        type: "contact_form",
        data: {
          heading: "Enquire about mentoring or supervision",
          intro: "Tell us which credential you are working toward, or what you would like from supervision.",
          formType: "mentoring",
          showDetails: true,
        },
      },
    ],
  },

  {
    path: "/services/coaching-services/",
    title: "Individual and Executive Coaching",
    seoTitle: "Individual and executive coaching",
    seoDescription:
      "One-to-one life, executive, career, productivity and business coaching, grounded in presence, inquiry and trust.",
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "",
          heading: "Individual and executive coaching",
          subheading: "One-to-one coaching partnerships grounded in presence, inquiry and trust.",
          primaryCta: BOOK,
          secondaryCta: link("Send an enquiry", "#enquire"),
          image: m("photo.executive-coaching-walk"),
          imageTall: null,
        },
      },
      {
        type: "feature_list",
        data: {
          heading: "Coaching for where you are now",
          intro: "Every engagement honours your context, your pace and your readiness.",
          items: [
            { title: "Life coaching", body: "For people navigating a transition or looking for clarity and direction, who want their choices to match their values." },
            { title: "Executive coaching", body: "For senior leaders and founders working on responsibility, influence, presence, communication and decision-making." },
            { title: "Career coaching", body: "For professionals seeking growth, preparing for a promotion or a change of role, or reassessing their direction." },
            { title: "Productivity coaching", body: "For people who want better focus, healthier habits and sustained effectiveness without burning out." },
            { title: "Business coaching", body: "For founders and business owners clarifying structure, direction, roles and decisions during growth or change." },
          ],
          image: m("photo.programme-pcc-deep-practice"),
          cta: NO_LINK,
        },
      },
      {
        type: "timeline",
        data: {
          background: "cream",
          heading: "How an engagement works",
          intro: "Coaching is available virtually, on site or as a mix of both.",
          steps: [
            { marker: "", title: "Start with a conversation", body: "Request a discovery call and tell us what you want to work on." },
            { marker: "", title: "Shape the work together", body: "We agree what you want from coaching and a rhythm that suits your context and pace." },
            { marker: "", title: "Coach, reflect, act", body: "Your coach brings full attention and respect. Reflection, insight and action follow from each conversation." },
          ],
        },
      },
      {
        type: "image_text",
        data: {
          heading: "What clients work toward",
          body: "<p>People come to coaching for clarity, confidence and change that lasts: a clearer view of their own patterns, more intentional choices, and action that fits who they are becoming.</p>",
          bullets: [],
          cta: NO_LINK,
          image: m("photo.reflection-journal"),
          imageSide: "left",
        },
      },
      {
        type: "contact_form",
        data: {
          background: "cream",
          heading: "Enquire about coaching",
          intro: "Tell us a little about what you want to work on and we will suggest a next step.",
          formType: "coaching",
          showDetails: true,
        },
      },
    ],
  },

  {
    path: "/services/corporate-programs/",
    title: "Corporate Programmes",
    seoTitle: "Corporate coaching and leadership development programmes",
    seoDescription:
      "Manager as a Coach, Leader as a Coach, Power of Presence and bespoke leadership journeys for organisations, designed around your context.",
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "For organisations",
          heading: "Leadership development that changes how people lead",
          subheading: "When thinking shifts, behaviour follows. When behaviour shifts, culture changes.",
          primaryCta: BOOK,
          secondaryCta: link("Send a corporate enquiry", "#enquire"),
          image: m("photo.corporate-leadership-workshop"),
          imageTall: null,
        },
      },
      {
        type: "trust_strip",
        data: {
          heading: "Organisations our founder has worked with",
          logos: [
            { image: m("logo.amazon"), name: "Amazon" },
            { image: m("logo.upgrad"), name: "upGrad" },
            { image: m("logo.vi"), name: "Vi" },
            { image: m("logo.axis-bank"), name: "Axis Bank" },
          ],
          facts: [],
        },
      },
      {
        type: "feature_list",
        data: {
          heading: "Core programmes",
          intro: "Each programme can run on its own or be combined into a longer leadership journey.",
          items: [
            {
              title: "Manager as a Coach",
              body: "For people managers. Builds a coaching mindset for everyday leadership, moving managers from managing tasks to developing people through listening, effective questioning and accountability.",
            },
            {
              title: "Leader as a Coach",
              body: "For senior leaders. Focuses on leadership presence, influence and responsibility, and on how a leader's thinking and behaviour shape culture.",
            },
            {
              title: "Power of Presence",
              body: "A focused programme on leadership presence: leading through awareness, trust and intentional action rather than authority alone.",
            },
            {
              title: "Bespoke corporate journeys",
              body: "Custom leadership journeys aligned to your organisation's needs, combining leadership coaching, team interventions, strengths-based assessments and facilitated learning over time.",
            },
          ],
          image: m("gallery.anup-facilitating-leadership-session"),
          cta: NO_LINK,
        },
      },
      {
        type: "image_text",
        data: {
          background: "cream",
          heading: "Designed around your context",
          body: "<p>Programmes are built for your organisation, not delivered off the shelf, through a blend of learning, coaching and practice.</p>",
          bullets: [
            "Shifting leaders from a directive to a developmental mindset",
            "Strengthening emotional intelligence and leadership presence",
            "Building trust, accountability and psychological safety",
            "Leading through influence rather than authority",
            "Helping teams think independently and take ownership",
          ],
          cta: NO_LINK,
          image: m("gallery.corporate-workshop-in-session"),
          imageSide: "left",
        },
      },
      { type: "faq", data: { heading: "Questions from organisations", intro: "", group: "corporate", cta: NO_LINK } },
      {
        type: "contact_form",
        data: {
          background: "cream",
          heading: "Tell us about your organisation",
          intro: "We start by learning about your context, your challenges and what you want to achieve.",
          formType: "corporate",
          showDetails: true,
        },
      },
    ],
  },

  {
    path: "/about-us/",
    title: "About BCA",
    seoTitle: "About Butterfly Coaching Academy",
    seoDescription:
      "Founded in 2022 by Anup Mittal, MCC, Butterfly Coaching Academy builds capable coaches and leaders through learning that is simple, applied and deeply human.",
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "About BCA",
          heading: "Real change begins within",
          subheading: "We build capable coaches and leaders through learning that is simple, applied and deeply human.",
          primaryCta: BOOK,
          secondaryCta: link("Meet the team", "#team"),
          image: m("gallery.bca-community-outdoors"),
          imageTall: null,
        },
      },
      {
        type: "image_text",
        data: {
          heading: "Our story",
          body:
            "<p>Butterfly Coaching Academy was founded in 2022 by Anup Mittal, after years of coaching and leadership work. Again and again he saw the same thing: people want change, but change does not come easily. The gap is rarely in knowing. It is in doing.</p>" +
            "<p>The butterfly in our name reflects how transformation really happens: in stages, the way a caterpillar becomes a butterfly. At a time when coach training was turning into a commodity, we chose to build capability rather than hand out certificates.</p>",
          bullets: [],
          cta: NO_LINK,
          image: m("photo.butterfly-on-leaf"),
          imageSide: "right",
        },
      },
      {
        type: "feature_list",
        data: {
          background: "cream",
          heading: "How we teach",
          intro: "Awareness leads to choice, choice leads to action, and action leads to transformation.",
          items: [
            { title: "Clarity over complexity", body: "We simplify learning so it is accessible and usable in any context." },
            { title: "Practice over theory", body: "Skills are built in real conversations, then observed and reflected on." },
            { title: "Reflection over instruction", body: "Feedback and mentoring help you see your own coaching clearly." },
            { title: "Open to everyone", body: "We welcome diverse learners. Coaching is for anyone and everyone." },
          ],
          image: m("photo.practice-feedback"),
          cta: link("Explore programmes", "/coaching-certifications/"),
        },
      },
      {
        type: "profiles",
        data: {
          anchor: "team",
          heading: "Meet the founder",
          intro: "",
          source: "all",
          facts: FOUNDER_FACTS,
          cta: NO_LINK,
        },
      },
      {
        type: "trust_strip",
        data: {
          background: "cream",
          heading: "ICF accreditation",
          logos: [
            { image: m("icf.level-1"), name: "ICF Level 1 accredited coaching education" },
            { image: m("icf.level-2"), name: "ICF Level 2 accredited coaching education" },
            { image: m("icf.level-3"), name: "ICF Level 3 accredited coaching education" },
          ],
          facts: [],
        },
      },
      {
        type: "rich_text",
        data: {
          background: "cream",
          heading: "Accreditation and credentials",
          body:
            "<p>BCA holds International Coaching Federation (ICF) accreditation for its Level 1, Level 2 and Level 3 coach education programmes. Our founder, Anup Mittal, holds the ICF Master Certified Coach (MCC) credential.</p>" +
            "<p>Programme certificates are awarded by BCA. ICF credentials (ACC, PCC and MCC) are awarded by ICF once you meet its requirements and pass its credentialing exam.</p>",
        },
      },
      {
        type: "gallery",
        data: {
          heading: "Moments from our workshops",
          intro: "",
          images: [
            { image: m("gallery.anup-facilitating-leadership-session"), caption: "" },
            { image: m("gallery.anup-with-table-group"), caption: "" },
            { image: m("gallery.workshop-cohort-group-photo"), caption: "" },
          ],
        },
      },
      closingCta(),
    ],
  },

  {
    path: "/testimonial/",
    title: "Student Stories",
    seoTitle: "Student stories and testimonials",
    seoDescription: "What coaches and leaders say about training with Butterfly Coaching Academy, in their own words.",
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "",
          heading: "Student stories",
          subheading: "What our learners say about training with Butterfly Coaching Academy, in their own words.",
          primaryCta: NO_LINK,
          secondaryCta: NO_LINK,
          image: null,
          imageTall: null,
        },
      },
      { type: "testimonials", data: { heading: "In their own words", intro: "", source: "all", limit: 60, cta: NO_LINK } },
      closingCta("Ready to write your own story?"),
    ],
  },

  {
    path: "/image-gallery/",
    title: "Gallery",
    seoTitle: "Gallery: workshops and community",
    seoDescription: "Photographs and videos from Butterfly Coaching Academy workshops, cohorts and events.",
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "",
          heading: "Gallery",
          subheading: "Workshops, cohorts and moments from the BCA community.",
          primaryCta: NO_LINK,
          secondaryCta: NO_LINK,
          image: null,
          imageTall: null,
        },
      },
      {
        type: "gallery",
        data: {
          heading: "",
          intro: "",
          images: [
            "bca-community-outdoors",
            "anup-facilitating-leadership-session",
            "anup-with-table-group",
            "corporate-workshop-in-session",
            "workshop-cohort-group-photo",
            "anup-engaging-audience",
            "anup-facilitating-workshop",
            "leadership-workshop-group",
            "workshop-cohort-celebrating",
            "young-professionals-cohort",
          ].map((name) => ({ image: m(`gallery.${name}`), caption: "" })),
        },
      },
      {
        type: "video",
        data: {
          background: "cream",
          anchor: "videos",
          heading: "Videos",
          intro: "From Coach Anup's YouTube channel.",
          videos: [
            { title: "Butterfly Coaching Academy: who we are and what we are creating", url: "https://www.youtube.com/watch?v=Um6HmH2ri34" },
            { title: "Why invest in coaching?", url: "https://www.youtube.com/watch?v=1naCXyRDdlM" },
            { title: "Dream, desire, purpose: FMS IIRM Jaipur", url: "https://www.youtube.com/watch?v=zoJmh0WXilo" },
            { title: "Orientation session at ICG, IIS University Jaipur", url: "https://www.youtube.com/watch?v=5IOUhaC-bls" },
          ],
        },
      },
    ],
  },

  {
    path: "/contact-us/",
    title: "Contact",
    seoTitle: "Contact Butterfly Coaching Academy",
    seoDescription: "Ask a question, request a discovery call, or message us on WhatsApp. We usually reply within one working day.",
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "",
          heading: "Let's talk",
          subheading: "Ask a question, request a discovery call, or tell us what you are working toward.",
          primaryCta: NO_LINK,
          secondaryCta: NO_LINK,
          image: null,
          imageTall: null,
        },
      },
      {
        type: "contact_form",
        data: { heading: "Send us a message", intro: "", formType: "general", showDetails: true },
      },
    ],
  },

  {
    path: "/thank-you/",
    title: "Thank you",
    seoDescription: "Thank you for contacting Butterfly Coaching Academy.",
    noindex: true,
    sections: [
      {
        type: "hero",
        data: {
          variant: "page",
          eyebrow: "",
          heading: "Thank you. Your message is with us.",
          subheading: "We usually reply within one working day. If it is urgent, call or message us on WhatsApp.",
          primaryCta: link("Back to the homepage", "/"),
          secondaryCta: link("WhatsApp us", "whatsapp"),
          image: null,
          imageTall: null,
        },
      },
      { type: "blog_teasers", data: { heading: "Something to read while you wait", intro: "", limit: 3, cta: link("All articles", "/blog/") } },
    ],
  },

  {
    path: "/privacy-policy/",
    title: "Privacy Policy",
    seoDescription: "How Butterfly Coaching Academy collects, uses and protects your personal information.",
    sections: [
      {
        type: "rich_text",
        data: {
          heading: "Privacy Policy",
          body:
            "<p><em>This policy describes how this website handles personal information. It has been drafted for review and must be approved by Butterfly Coaching Academy and its legal adviser before launch.</em></p>" +
            "<h2>Who we are</h2><p>This website is operated by Butterfly Coaching Academy Pvt. Limited, Flat No T-8118A, 8th Floor, Block 30, Rangoli Gardens, Jaipur 302034, India. You can contact us at contact@butterflycoachingacademy.com.</p>" +
            "<h2>Information we collect</h2><ul><li><strong>Enquiries.</strong> When you send an enquiry we collect your name, email address, and any phone number, organisation, role and message you choose to give us. We also record the page you sent the form from.</li><li><strong>Newsletter.</strong> If you subscribe, we store your email address and the date you subscribed.</li><li><strong>Campaign information.</strong> If you arrive from a link that includes campaign parameters and you have accepted analytics, those parameters are stored with your enquiry so we know which campaign you came from.</li><li><strong>Analytics.</strong> If analytics is enabled and you accept it, we collect anonymised usage information such as pages viewed and buttons clicked.</li></ul>" +
            "<h2>How we use it</h2><p>We use your information to reply to you, to provide the programmes and services you ask about, and, if you have agreed, to send you our newsletter. We do not sell your personal information.</p>" +
            "<h2>Cookies</h2><p>The site works without tracking cookies. Analytics cookies are set only if you accept them in the consent banner. You can change your mind at any time by clearing this site's data in your browser.</p>" +
            "<h2>Who we share it with</h2><p>We use trusted service providers to host this website and its database and to deliver email. They process information on our behalf and only as needed to provide their service.</p>" +
            "<h2>How long we keep it</h2><p>We keep enquiry records for as long as needed to respond to you and to maintain our business records, and newsletter subscriptions until you unsubscribe.</p>" +
            "<h2>Your rights</h2><p>You can ask us for a copy of the information we hold about you, ask us to correct or delete it, or withdraw your consent to marketing at any time, by emailing contact@butterflycoachingacademy.com.</p>" +
            "<h2>Changes</h2><p>We may update this policy from time to time. The current version is always available on this page.</p>",
        },
      },
    ],
  },

  {
    path: "/terms-of-use/",
    title: "Terms of Use",
    seoDescription: "The terms that apply when you use the Butterfly Coaching Academy website.",
    sections: [
      {
        type: "rich_text",
        data: {
          heading: "Terms of Use",
          body:
            "<p><em>These terms have been drafted for review and must be approved by Butterfly Coaching Academy and its legal adviser before launch.</em></p>" +
            "<h2>About this website</h2><p>This website is operated by Butterfly Coaching Academy Pvt. Limited. By using it you agree to these terms. If you do not agree, please do not use the site.</p>" +
            "<h2>Information on this site</h2><p>We take care to keep the information on this site accurate and current, but programme details, dates and fees can change. Please confirm the details with us before you make a decision based on them.</p>" +
            "<h2>Programmes and credentials</h2><p>Enrolment in any programme is subject to a separate agreement between you and Butterfly Coaching Academy. Programme certificates are awarded by Butterfly Coaching Academy. ICF credentials are awarded by the International Coaching Federation, subject to its own requirements.</p>" +
            "<h2>Intellectual property</h2><p>The content of this site, including text, images, the iKAN framework and the Butterfly Coaching Academy name and logo, belongs to Butterfly Coaching Academy or its licensors. You may not reproduce it without our written permission. Third-party names and logos belong to their respective owners.</p>" +
            "<h2>Acceptable use</h2><p>Please do not misuse this site, attempt to gain unauthorised access to it, or use it to send unsolicited or unlawful material.</p>" +
            "<h2>Links to other sites</h2><p>This site may link to websites we do not control. We are not responsible for their content or their privacy practices.</p>" +
            "<h2>Liability</h2><p>To the extent permitted by law, Butterfly Coaching Academy is not liable for any loss arising from your use of this website or reliance on its content.</p>" +
            "<h2>Governing law</h2><p>These terms are governed by the laws of India, and the courts of Jaipur, Rajasthan have jurisdiction.</p>" +
            "<h2>Contact</h2><p>Questions about these terms can be sent to contact@butterflycoachingacademy.com.</p>",
        },
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

type NavSeed = { label: string; href: string; description?: string; children?: NavSeed[] };

export const NAVIGATION: Record<"header" | "footer_programmes" | "footer_company" | "footer_legal", NavSeed[]> = {
  header: [
    {
      label: "Programmes",
      href: "/coaching-certifications/",
      children: [
        { label: "All programmes", href: "/coaching-certifications/", description: "Compare the ICF credential pathways" },
        { label: "Level 1: ACC", href: "/level-1-acc-coach-program/", description: "A strong professional foundation" },
        { label: "Level 2: PCC", href: "/level-2-pcc-coach-program/", description: "Depth and integration" },
        { label: "Level 3: MCC", href: "/level-3-mcc-program/", description: "Mastery and contribution" },
      ],
    },
    {
      label: "Services",
      href: "/services/mentor-coaching-supervision/",
      children: [
        { label: "Mentoring and Supervision", href: "/services/mentor-coaching-supervision/", description: "For ICF credentialing and reflective practice" },
        { label: "Individual and Executive Coaching", href: "/services/coaching-services/", description: "One-to-one coaching partnerships" },
        { label: "Corporate Programmes", href: "/services/corporate-programs/", description: "Leadership development for organisations" },
      ],
    },
    {
      label: "About",
      href: "/about-us/",
      children: [
        { label: "About BCA", href: "/about-us/", description: "Our story, founder and faculty" },
        { label: "Student Stories", href: "/testimonial/", description: "Learners in their own words" },
        { label: "Gallery", href: "/image-gallery/", description: "Workshops and community" },
      ],
    },
    { label: "Resources", href: "/blog/" },
    { label: "Contact", href: "/contact-us/" },
  ],
  footer_programmes: [
    { label: "Level 1: ACC", href: "/level-1-acc-coach-program/" },
    { label: "Level 2: PCC", href: "/level-2-pcc-coach-program/" },
    { label: "Level 3: MCC", href: "/level-3-mcc-program/" },
    { label: "Mentoring and Supervision", href: "/services/mentor-coaching-supervision/" },
    { label: "Individual and Executive Coaching", href: "/services/coaching-services/" },
    { label: "Corporate Programmes", href: "/services/corporate-programs/" },
  ],
  footer_company: [
    { label: "About BCA", href: "/about-us/" },
    { label: "Student Stories", href: "/testimonial/" },
    { label: "Resources", href: "/blog/" },
    { label: "Gallery", href: "/image-gallery/" },
    { label: "Contact", href: "/contact-us/" },
  ],
  footer_legal: [
    { label: "Privacy Policy", href: "/privacy-policy/" },
    { label: "Terms of Use", href: "/terms-of-use/" },
  ],
};

/* -------------------------------------------------------------------------- */
/* Redirects: legacy WordPress URLs                                           */
/* -------------------------------------------------------------------------- */

export const REDIRECTS: { source: string; destination: string; statusCode?: number; note: string }[] = [
  { source: "/our-team/", destination: "/about-us/#team", note: "Team page merged into About BCA" },
  { source: "/our-team/coach-anup/", destination: "/about-us/#team", note: "Legacy team profile" },
  { source: "/our-team/kanika-vijai/", destination: "/about-us/#team", note: "Legacy team profile" },
  { source: "/our-team/vijay-srinivasan/", destination: "/about-us/#team", note: "Legacy team profile" },
  { source: "/our-team/sucheta-kulkarni/", destination: "/about-us/#team", note: "Legacy team profile" },
  { source: "/our-team/misk-khurana/", destination: "/about-us/#team", note: "Legacy team profile" },
  { source: "/services/", destination: "/coaching-certifications/", note: "Services index replaced by Programmes" },
  { source: "/video-gallery/", destination: "/image-gallery/#videos", note: "Videos now sit on the Gallery page" },
  { source: "/assessments/", destination: "/services/corporate-programs/", statusCode: 302, note: 'Legacy "coming soon" page. Temporary until an Assessments page exists.' },
  { source: "/home-2/", destination: "/", note: "Legacy duplicate homepage" },
  { source: "/linkedln-profile-post/", destination: "/blog/", note: "Legacy stray page" },
  {
    source: "/unleash-your-wings-of-confidence-with-butterfly-coaching-academy/",
    destination: "/blog/",
    statusCode: 302,
    note: "Article held as a draft pending verification of its outcome figures. Turn this redirect off when the article is republished.",
  },
];

/* -------------------------------------------------------------------------- */
/* Blog: featured images for the imported articles                            */
/* -------------------------------------------------------------------------- */

/** The legacy featured images had unclear licences, so each post gets an image from the new set. */
export const POST_IMAGES: Record<string, string> = {
  "becoming-an-entrepreneur-some-key-aspects": "photo.blog-founder-at-work",
  "mental-wellness-and-resilience-the-power-of-coaching": "photo.blog-window-reflection",
  "the-power-of-habits-cultivating-your-path-to-success": "photo.blog-morning-routine",
  "elevate-your-career-with-butterfly-coaching-academy": "photo.blog-steps-forward",
  "unleash-your-wings-of-confidence-with-butterfly-coaching-academy": "photo.blog-speaking-with-confidence",
  "unleashing-the-power-of-effective-communication": "photo.blog-conversation-table",
  "are-your-goals-further-away-than-ever": "photo.blog-planning-desk",
  "dont-procrastinate-begin-your-transformation-now": "photo.reflection-journal",
  "fluttering-focus-navigating-change-with-butterfly-coaching-tip": "photo.blog-repotting-plant",
  "unleash-the-power-of-the-butterfly-effect-in-coaching": "photo.butterfly-on-leaf",
  "the-power-of-goal-attainment-through-coaching": "photo.blog-reviewing-progress",
  "the-power-of-clear-communication-through-coaching": "photo.practice-feedback",
  "fluttering-insights-nurturing-self-awareness-and-self-reflection-at-butterfly-coaching-academy": "photo.cohort-community",
};

/**
 * Imported articles that are NOT published by default. This one reports outcome
 * percentages for BCA participants and quotes unnamed participants; neither
 * could be verified, so it waits as a draft for the owner to check.
 * See docs/CONTENT_APPROVAL_CHECKLIST.md.
 */
export const DRAFT_POSTS = new Set(["unleash-your-wings-of-confidence-with-butterfly-coaching-academy"]);
