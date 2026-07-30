// Context: contract drafting language.
//
// All documents are HYPOTHETICAL. The clauses below are composed for teaching
// purposes in the style of PRC commercial agreements; they are not taken from,
// and should not be used as, any real contract.

export default {
  id: 'contracts',
  name: 'Contracts',
  nameZh: '合同条款',
  blurb:
    'Operative clause language: obligations, carve-outs, definitions and the 应当/不得/除非 machinery that makes a clause bite.',
  icon: '§',
  docs: [
    {
      id: 'ct-confidentiality',
      title: 'Confidentiality and non-compete clauses',
      titleZh: '保密义务与竞业限制条款',
      level: 'B2',
      summary:
        'Standard confidentiality clause with its exceptions, followed by a post-closing non-compete on the seller.',
      meta: [
        ['文件', '《股权转让协议》（示范文本）'],
        ['条款', '第九条—第十条'],
      ],
      paragraphs: [
        '第九条　保密义务',
        '9.1　除本协议另有约定外，任何一方（"接收方"）对因本协议知悉的对方（"披露方"）的商业秘密、技术资料、客户名单、财务数据及其他非公开信息（统称"保密信息"），均负有保密义务；未经披露方事先书面同意，不得向任何第三方披露、提供或允许其使用。',
        '9.2　下列信息不属于保密信息：（一）在披露时已为公众所知悉的信息；（二）非因接收方违反本协议而进入公有领域的信息；（三）接收方在接收前已合法持有且不负保密义务的信息；（四）依照法律、行政法规或者证券交易所规则应予披露的信息，但接收方应在法律允许的范围内事先通知披露方。',
        '9.3　本条约定的保密义务在本协议终止或者解除后继续有效，期限为五年。',
        '第十条　竞业限制',
        '10.1　自本协议签署之日起至交割日后二十四个月内，卖方及其关联方不得在中华人民共和国境内直接或间接从事与目标公司主营业务相同或者具有实质性竞争关系的业务。',
        '10.2　卖方违反前款约定的，应向买方支付违约金人民币五百万元；违约金不足以弥补买方损失的，卖方还应就不足部分予以赔偿。',
      ],
    },
    {
      id: 'ct-breach-disputes',
      title: 'Breach, force majeure and dispute resolution',
      titleZh: '违约责任、不可抗力与争议解决',
      level: 'B2',
      summary:
        'The back-end of a commercial agreement: cure periods, default interest, force majeure and an arbitration clause.',
      meta: [
        ['文件', '《股权转让协议》（示范文本）'],
        ['条款', '第十五条—第十七条'],
      ],
      paragraphs: [
        '第十五条　违约责任',
        '15.1　任何一方未能履行本协议项下的义务，或者其作出的陈述与保证存在重大不实、遗漏的，即构成违约。守约方有权要求违约方在收到书面通知后三十日内予以补救。',
        '15.2　违约方逾期未予补救的，守约方有权解除本协议，并要求违约方赔偿因此遭受的直接损失，包括但不限于律师费、仲裁费、评估费及其他合理支出。',
        '15.3　除因不可抗力外，买方逾期支付价款的，每逾期一日，应按逾期金额的万分之五向卖方支付违约金。',
        '第十六条　不可抗力',
        '16.1　"不可抗力"指不能预见、不能避免且不能克服的客观情况，包括地震、台风、洪水、战争、疫情以及政府颁布的禁令。',
        '16.2　遭受不可抗力的一方应在事件发生后十五日内提供有权机关出具的证明文件，并采取合理措施减轻损失。',
        '第十七条　法律适用与争议解决',
        '17.1　本协议的订立、效力、解释、履行及争议解决均适用中华人民共和国法律。',
        '17.2　因本协议引起的或者与之有关的任何争议，双方应首先通过友好协商解决；协商不成的，任何一方均有权提交仲裁委员会，按照其届时有效的仲裁规则进行仲裁。仲裁裁决是终局的，对双方均有约束力。',
      ],
    },
  ],
};
