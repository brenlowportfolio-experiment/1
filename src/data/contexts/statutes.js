// Context: statutes and regulations (法律法规).
//
// This context breaks the corpus rule that everything else follows, and does so
// deliberately. Elsewhere the documents are hypothetical because reproducing a
// real email, contract or judgment would expose someone's affairs. A statute
// raises neither issue: under Article 5 of the PRC Copyright Law, laws and
// regulations carry no copyright, and there is nothing confidential in a text
// published precisely so that everyone may read it.
//
// It would also defeat the purpose. You cannot paraphrase 第五百七十七条 and
// still be learning 第五百七十七条 — the exact wording is the object of study,
// because the exact wording is what gets argued over.
//
// Translations here are written for this app; the statutory Chinese is quoted
// as enacted.

export default {
  id: 'statutes',
  name: 'Statutes',
  nameZh: '法律法规',
  blurb:
    'Enacted text, quoted verbatim. Dense conditional syntax — 的-clauses as protases, 应当/不得/可以 as the operators, 但是…除外 as the carve-out — and the vocabulary every contract and judgment is built on.',
  icon: '§§',
  docs: [
    {
      id: 'st-civilcode-general',
      title: 'Civil Code, Book III (Contract) — general provisions',
      titleZh: '《中华人民共和国民法典》第三编　合同　第一章　一般规定',
      level: 'B2+',
      verbatim: true,
      summary:
        'Articles 463–468: what the Contract book governs, when a contract binds, and how disputed terms are construed.',
      meta: [
        ['出处', '《中华人民共和国民法典》（2020年5月28日通过）'],
        ['条文', '第四百六十三条—第四百六十八条'],
        ['性质', '法律条文，依法不适用著作权保护'],
      ],
      paragraphs: [
        '第四百六十三条　本编调整因合同产生的民事关系。',
        '第四百六十四条　合同是民事主体之间设立、变更、终止民事法律关系的协议。',
        '婚姻、收养、监护等有关身份关系的协议，适用有关该身份关系的法律规定；没有规定的，可以根据其性质参照适用本编规定。',
        '第四百六十五条　依法成立的合同，受法律保护。',
        '依法成立的合同，仅对当事人具有法律约束力，但是法律另有规定的除外。',
        '第四百六十六条　当事人对合同条款的理解有争议的，应当依据本法第一百四十二条第一款的规定，确定争议条款的含义。',
        '合同文本采用两种以上文字订立并约定具有同等效力的，对各文本使用的词句推定具有相同含义。各文本使用的词句不一致的，应当根据合同的相关条款、性质、目的以及诚信原则等予以解释。',
        '第四百六十七条　本法或者其他法律没有明文规定的合同，适用本编通则的规定，并可以参照适用本编或者其他法律最相类似合同的规定。',
        '在中华人民共和国境内履行的中外合资经营企业合同、中外合作经营企业合同、中外合作勘探开发自然资源合同，适用中华人民共和国法律。',
        '第四百六十八条　非因合同产生的债权债务关系，适用有关该债权债务关系的法律规定；没有规定的，适用本编通则的有关规定，但是根据其性质不能适用的除外。',
      ],
    },
  ],
};
