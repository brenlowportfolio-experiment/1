// Context: professional correspondence between lawyers / with clients.
//
// All documents are HYPOTHETICAL. Firms, people, companies and dates are
// invented. They imitate the register and structure of real PRC legal
// correspondence without reproducing any actual document.

export default {
  id: 'emails',
  name: 'Emails',
  nameZh: '往来邮件',
  blurb:
    'Counterparty and client correspondence: mark-ups, requests, chasers. Heavy on polite register, hedging and the fixed openings/closings of Chinese business letters.',
  icon: '✉',
  docs: [
    {
      id: 'em-spa-comments',
      title: 'Reply on proposed amendments to the SPA',
      titleZh: '关于《股权转让协议》修改意见的回复',
      level: 'B2',
      summary:
        'Associate replies to opposing counsel with clause-by-clause comments on a share transfer agreement.',
      meta: [
        ['发件人', '李明（恒达律师事务所）'],
        ['收件人', '王律师（安泰律师事务所）'],
        ['日期', '2025年3月17日'],
      ],
      paragraphs: [
        '主题：关于《股权转让协议》修改意见的回复',
        '王律师：',
        '您好。收到贵所上周五发来的《股权转让协议》修订稿，我方已与客户逐条讨论，现将主要意见回复如下。',
        '一、关于第五条价款支付安排。我方原则上同意分期支付，但建议将第二期款项的支付条件由"工商变更登记完成之日起十个工作日内"调整为"目标公司完成工商变更登记且卖方交付全部交割文件之日起十个工作日内"，以避免交割文件迟延交付带来的风险。',
        '二、关于第八条陈述与保证。贵方在草案中删除了卖方对目标公司或有负债的保证条款，我方难以接受。鉴于尽职调查中尚有两起诉讼未了结，建议恢复该条款，并相应设置赔偿上限为转让价款的百分之二十。',
        '三、关于第十二条争议解决。我方接受提交仲裁委员会仲裁，但建议仲裁地由北京改为上海，仲裁语言为中文。',
        '以上意见供参考。如无重大分歧，建议本周四上午安排电话会议，就剩余条款进行最后确认。',
        '顺颂商祺',
        '李明　恒达律师事务所',
      ],
    },
    {
      id: 'em-dd-request',
      title: 'Second-round due diligence request list',
      titleZh: '尽职调查补充资料清单（第二批）',
      level: 'B2',
      summary:
        'Partner sends a target company a structured list of further documents required for legal due diligence.',
      meta: [
        ['发件人', '张晓芸（恒达律师事务所　合伙人）'],
        ['收件人', '锦阳科技有限公司　项目组'],
        ['日期', '2025年4月8日'],
      ],
      paragraphs: [
        '主题：尽职调查补充资料清单（第二批）',
        '各位：',
        '根据本周一现场访谈及初步查阅的结果，现将法律尽职调查所需补充提供的资料列明如下，烦请贵司于本月二十五日前以电子版形式反馈。',
        '一、公司治理方面：近三年股东会及董事会决议原件扫描件；现行有效的公司章程及历次修订记录。',
        '二、重大合同方面：合同金额在人民币五百万元以上的在履行合同清单，并附主要条款摘要；涉及排他性安排或控制权变更条款的合同全文。',
        '三、劳动人事方面：全体员工劳动合同签署率统计；社会保险及住房公积金缴纳凭证；竞业限制协议签署情况。',
        '四、知识产权方面：已注册商标及专利清单；许可他人使用或被许可使用的知识产权协议。',
        '五、诉讼与合规方面：近三年行政处罚记录；正在进行或可预见的诉讼、仲裁案件的基本情况说明。',
        '如相关资料涉及商业秘密，可在签署保密函后于资料室查阅。资料提供过程中如有疑问，请随时与本人联系。',
        '此致',
        '张晓芸　恒达律师事务所　合伙人',
      ],
    },
  ],
};
