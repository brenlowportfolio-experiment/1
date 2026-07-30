// Context: PRC civil judgments (案例/判决书).
//
// All documents are HYPOTHETICAL. Courts, parties, case numbers and facts are
// invented. They follow the conventional structure and formulaic language of
// PRC civil judgments — 经审理查明 / 本院认为 / 判决如下 — without reproducing
// any real decision. Statute names are cited generically for realism.

export default {
  id: 'judgments',
  name: 'Judgments',
  nameZh: '裁判文书',
  blurb:
    'The fixed architecture of a Chinese civil judgment, and the formal connectives (遂、故、据此、综上) that carry its reasoning.',
  icon: '⚖',
  docs: [
    {
      id: 'jg-sale-contract',
      title: 'Sale of goods dispute — first instance',
      titleZh: '买卖合同纠纷一审民事判决书（节选）',
      level: 'B2+',
      summary:
        'Supplier sues for the unpaid balance on machine tools; buyer raises a defence of prior performance based on alleged defects.',
      meta: [
        ['法院', '江华市锦阳区人民法院（虚构）'],
        ['案号', '（2024）示民初001号（虚构）'],
        ['案由', '买卖合同纠纷'],
      ],
      paragraphs: [
        '原告：宏图机械制造有限公司，住所地江华市锦阳区。',
        '被告：瑞泽建设工程有限公司，住所地江华市云溪区。',
        '本院经审理查明：2023年4月10日，原告与被告签订《设备采购合同》，约定由原告向被告供应数控机床两台，合同金额共计人民币三百二十万元。合同约定，被告应于设备安装调试合格之日起三十日内支付全部价款；逾期付款的，按未付金额每日万分之三支付违约金。',
        '2023年7月18日，涉案设备安装调试完毕，双方签署验收单。此后被告分两次支付价款共计人民币一百八十万元，剩余一百四十万元至今未付。原告多次催告未果，遂诉至本院，请求判令被告支付剩余价款并承担违约金及本案诉讼费用。',
        '被告辩称：涉案设备在验收后频繁出现故障，原告未按合同约定提供售后维修服务，故被告有权行使先履行抗辩权，暂缓支付剩余价款。',
        '本院认为：原、被告签订的《设备采购合同》系双方真实意思表示，内容不违反法律、行政法规的强制性规定，合法有效，双方均应恪守。被告主张行使先履行抗辩权，但未能提供充分证据证明原告存在根本违约行为，其提交的维修记录亦不足以证明设备存在质量问题，故对该抗辩本院不予采纳。',
        '依照《中华人民共和国民法典》有关买卖合同价款支付及违约责任之规定，判决如下：',
        '一、被告瑞泽建设工程有限公司于本判决生效之日起十日内向原告宏图机械制造有限公司支付货款人民币一百四十万元；',
        '二、被告瑞泽建设工程有限公司于本判决生效之日起十日内向原告支付逾期付款违约金；',
        '三、驳回原告的其他诉讼请求。',
        '案件受理费由被告负担。如不服本判决，可在判决书送达之日起十五日内向本院递交上诉状。',
      ],
    },
    {
      id: 'jg-labour-appeal',
      title: 'Labour dispute — appellate judgment',
      titleZh: '劳动争议二审民事判决书（节选）',
      level: 'C1',
      summary:
        'Employer appeals a finding of unlawful termination; the court addresses burden of proof on internal rules and union notification.',
      meta: [
        ['法院', '江华市中级人民法院（虚构）'],
        ['案号', '（2024）示民终118号（虚构）'],
        ['案由', '劳动争议'],
      ],
      paragraphs: [
        '上诉人（原审被告）：远见信息技术（江华）有限公司。',
        '被上诉人（原审原告）：周某某。',
        '上诉人因与被上诉人劳动争议一案，不服江华市锦阳区人民法院作出的一审民事判决，向本院提起上诉。本院依法组成合议庭，公开开庭进行了审理。本案现已审理终结。',
        '上诉人上诉称：被上诉人在职期间多次迟到早退，且未按要求完成绩效目标，已严重违反公司规章制度，公司据此解除劳动合同符合法律规定，不属于违法解除；一审判决认定事实不清，请求二审法院依法改判。',
        '被上诉人答辩称：公司从未就所谓考勤问题向其发出书面警告；公司提交的规章制度亦未经民主程序制定并向劳动者公示，不能作为解除劳动合同的依据。请求驳回上诉，维持原判。',
        '本院经审理认为：用人单位以劳动者严重违反规章制度为由单方解除劳动合同的，应当就规章制度的合法性、劳动者行为的严重性以及解除程序的正当性承担举证责任。本案中，上诉人提交的《员工手册》未提供经职工代表大会讨论通过及向被上诉人送达、公示的证据，故不能作为解除依据；上诉人亦未在解除前将解除理由通知工会。据此，上诉人解除劳动合同缺乏事实和法律依据，构成违法解除，应当依照法律规定支付赔偿金。',
        '综上，上诉人的上诉请求不能成立，本院不予支持；一审判决认定事实清楚，适用法律正确，应予维持。依照《中华人民共和国民事诉讼法》有关二审程序之规定，判决如下：',
        '驳回上诉，维持原判。',
        '二审案件受理费由上诉人负担。本判决为终审判决。',
      ],
    },
  ],
};
