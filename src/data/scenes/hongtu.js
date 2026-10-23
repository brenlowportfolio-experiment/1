// 宏图诉瑞泽 — Hongtu v Ruize.
//
// An unpaid-price dispute over two CNC machines, followed from the first
// client meeting to the courtroom. The story ends in a document the app
// already holds: the first-instance judgment in Judgments. Every fact here is
// chosen to agree with that judgment — the dates, the sums, the defence of
// prior performance, the maintenance records the court would not trust, and
// the claim it dismissed — so that reading the judgment last, you know why
// each sentence in it is there.
//
// All of it is invented. The firms recur from elsewhere in the corpus on
// purpose: 恒达 and 安泰 met over a share transfer in Emails, and meet again
// here.

const SPEAKERS = {
  陈总: {
    en: 'Chen Lixin — general manager of Hongtu, the client',
    side: 'claimant',
  },
  张律师: {
    en: 'Zhang Xiaoyun — partner at Hengda, counsel for Hongtu',
    side: 'claimant',
  },
  王律师: {
    en: 'Wang — Antai Law Firm, counsel for Ruize',
    side: 'respondent',
  },
  证人: {
    en: 'Sun Jianping — head of Ruize’s equipment department, called by Ruize',
    side: 'respondent',
  },
  调解员: {
    en: 'Zhou Min — court-appointed mediator',
    side: 'neutral',
  },
  审判长: {
    en: 'Presiding judge',
    side: 'neutral',
  },
};

const CASE = ['案件', '宏图机械制造有限公司诉瑞泽建设工程有限公司（虚构）'];

export const story = {
  id: 'hongtu',
  titleZh: '宏图诉瑞泽',
  title: 'Hongtu v Ruize',
  blurb:
    'An unpaid invoice for two machine tools, from the first client meeting to judgment: a mediation that collapses, a witness caught out, closing argument.',
  parts: ['dl-interview', 'dl-mediation', 'dl-cross', 'dl-closing', 'jg-sale-contract'],
};

export const docs = [
  {
    id: 'dl-interview',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'Prologue — the client meeting',
    titleZh: '序幕：律师会见',
    level: 'B2',
    summary:
      'Hongtu’s general manager brings his lawyer an unpaid invoice and a grievance. She wants a timeline, the documents, and a strategy before anyone gets angry.',
    meta: [CASE, ['场景', '恒达律师事务所会议室'], ['人物', '陈总、张律师']],
    paragraphs: [
      '陈总：张律师，情况我在电话里大概说过了。瑞泽那边还欠我们一百四十万货款，拖了快一年了。',
      '张律师：陈总，我们先把时间线理清楚。合同是什么时候签的？',
      '陈总：二〇二三年四月十号。两台数控机床，合同金额三百二十万。',
      '张律师：付款条件是怎么约定的？',
      '陈总：安装调试合格之日起三十日内付清全款。七月十八号双方签了验收单，他们之后分两次付了一百八十万，剩下的一直不付。',
      '张律师：验收单原件在您手上吗？',
      '陈总：在，上面盖了他们的公章。',
      '张律师：很好，这是我们最关键的证据。对方不付款，给过什么理由吗？',
      '陈总：说机器老出故障，说我们售后不到位。可他们从来没有书面通知过我们，都是电话里随口一提。',
      '张律师：这一点很重要。如果对方主张质量问题，却没有在合理期限内书面提出异议，他们的抗辩就站不住脚。不过我得提醒您，对方很可能会拿出一份维修记录。',
      '陈总：维修记录？我们的工程师去过两次，每次都是操作问题，机器本身没毛病。',
      '张律师：那请您把工程师每次上门的服务单都找出来，尤其是有对方签字的。另外，合同里有没有违约金条款？',
      '陈总：有，逾期付款按每日万分之三计算。',
      '张律师：好。我的建议是先发律师函催告，同时向法院申请诉前调解。调解不成，我们再起诉。',
      '陈总：调解？我不想再跟他们耗时间了。',
      '张律师：我理解。但调解快，成本低，法院也鼓励先调解。就算谈不成，我们也能摸清对方的底牌。',
    ],
    moments: [
      {
        p: 1,
        who: '张律师',
        cue: 'The client opens with a year’s worth of grievance. Take control of the meeting: say you want the timeline straight first, starting with when the contract was signed.',
        en: 'Mr Chen, let’s get the timeline straight first. When was the contract signed?',
        keys: ['时间线', '理清楚'],
      },
      {
        p: 7,
        who: '张律师',
        cue: 'He holds the original acceptance certificate, sealed by Ruize. Tell him that is your most important evidence — then ask what reason Ruize has given for not paying.',
        en: 'Very good — that’s our most important piece of evidence. Has the other side given any reason for not paying?',
        keys: ['关键的证据', '理由'],
      },
      {
        p: 9,
        who: '张律师',
        cue: 'Ruize only ever complained by phone. Explain why that matters for a quality defence — and warn him what Ruize is likely to produce.',
        en: 'That’s very important. If they allege quality problems but never raised a written objection within a reasonable period, their defence won’t stand up. But I should warn you: they will very likely produce a maintenance log.',
        keys: ['合理期限', '书面提出异议', '站不住脚'],
      },
      {
        p: 13,
        who: '张律师',
        cue: 'Give your recommendation: a lawyer’s letter demanding payment, and at the same time an application to the court for pre-action mediation. Sue only if that fails.',
        en: 'Right. My advice is to send a lawyer’s letter demanding payment first, and at the same time apply to the court for pre-action mediation. If mediation fails, then we sue.',
        keys: ['律师函', '催告', '诉前调解'],
      },
      {
        p: 15,
        who: '张律师',
        cue: 'He doesn’t want to waste more time on mediation. Acknowledge that, then sell it: quick, cheap, the court encourages it — and even if it fails, you’ll see their hand.',
        en: 'I understand. But mediation is quick and cheap, and the court encourages it. Even if it fails, we’ll find out what cards they’re holding.',
        keys: ['摸清', '底牌'],
      },
    ],
  },
  {
    id: 'dl-mediation',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'Pre-action mediation — and why it fails',
    titleZh: '诉前调解',
    level: 'B2+',
    summary:
      'A court-appointed mediator tries to close the gap. Hongtu offers to waive the late-payment penalty; Ruize wants 400,000 knocked off for losses it cannot document. Tempers fray.',
    meta: [CASE, ['场景', '江华市锦阳区人民法院诉前调解室'], ['人物', '调解员、张律师、陈总、王律师']],
    paragraphs: [
      '调解员：各位好。今天是诉前调解，本着自愿、合法的原则进行。我先说明一点：调解过程中各方作出的让步，不作为日后诉讼中对其不利的证据，所以大家可以开诚布公。先请申请方陈述。',
      '张律师：谢谢调解员。我方的诉求很简单：瑞泽公司支付剩余货款一百四十万元，以及按合同约定计算的逾期付款违约金。设备已经验收合格，验收单上有对方的公章。',
      '王律师：调解员，我方并不否认验收单的真实性。但验收只能说明设备在当时能够运行，并不意味着设备没有质量问题。验收之后机床频繁故障，严重影响了我方的施工进度。',
      '张律师：频繁故障？那请问对方，什么时候以书面形式向我方提出过质量异议？',
      '王律师：我方多次电话联系过贵司。',
      '张律师：电话联系，有记录吗？',
      '调解员：好，双方都先冷静一下。我们今天不是来审案子的，是来找一个双方都能接受的方案。王律师，贵方现在的立场是什么？',
      '王律师：我方愿意支付部分款项，但需要扣减因设备故障造成的损失，大约四十万。',
      '陈总：四十万？这完全是凭空捏造的数字！',
      '调解员：陈总，请您先让王律师说完。',
      '王律师：另外，违约金我方不能接受。',
      '张律师：调解员，我方可以作出让步。如果对方在一个月内一次性付清一百四十万，我方愿意放弃全部违约金。这是我们最大的诚意。',
      '调解员：王律师，这个方案您看怎么样？放弃违约金，让步其实已经不小了。',
      '王律师：我需要向客户请示。但我可以先表个态：一百四十万全额，我方很难接受。',
      '调解员：那我们休息十分钟，我分别和各方单独谈一谈。',
      '（十分钟后）',
      '调解员：经过沟通，双方的分歧主要在于是否扣减所谓的故障损失。既然双方都坚持各自的立场，今天的调解只能到此为止。调解不成的，申请方可以依法向人民法院起诉。',
      '张律师：明白。我方会尽快立案。',
    ],
    moments: [
      {
        p: 3,
        who: '张律师',
        cue: 'Opposing counsel says the machines failed “frequently” after acceptance. Throw it back at him: when did Ruize ever raise a quality objection in writing?',
        en: 'Frequent failures? Then may I ask the other side: when did you ever raise a quality objection with us in writing?',
        keys: ['书面形式', '质量异议'],
      },
      {
        p: 5,
        who: '张律师',
        cue: '“We phoned you many times.” One short question that exposes the gap.',
        en: 'By phone — is there any record of that?',
        keys: ['有记录'],
      },
      {
        p: 6,
        who: '调解员',
        cue: 'You are the mediator, and this is turning into a cross-examination. Cool everyone down, remind them what today is for, and ask Ruize’s counsel for his position.',
        en: 'All right, let’s both calm down a little. We’re not here to try the case today — we’re here to find a solution both sides can accept. Mr Wang, what is your side’s position now?',
        keys: ['冷静', '双方都能接受的方案', '立场'],
      },
      {
        p: 11,
        who: '张律师',
        cue: 'Make your concession: you will waive the entire late-payment penalty — but only if Ruize pays the full 1.4 million in one lump sum within a month. Present it as your best offer.',
        en: 'Mediator, we can make a concession. If the other side pays the full 1.4 million in one lump sum within a month, we are willing to waive the late-payment penalty entirely. That is as far as our good faith goes.',
        keys: ['作出让步', '一次性付清', '放弃', '诚意'],
      },
      {
        p: 13,
        who: '王律师',
        cue: 'You act for Ruize and can’t accept without instructions. Say so — but signal now that paying the full 1.4 million is very hard for your side to accept.',
        en: 'I need to take instructions from my client. But I can tell you now where we stand: the full 1.4 million is very difficult for us to accept.',
        keys: ['请示', '表个态', '很难接受'],
      },
    ],
  },
  {
    id: 'dl-cross',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'The witness — maintenance records under questioning',
    titleZh: '庭审：证人出庭',
    level: 'C1',
    summary:
      'Ruize calls its equipment manager to prove the machines kept failing. Under Zhang’s questions, the maintenance log turns out to have been written after the fact — and one breakdown was Ruize’s own operator error.',
    meta: [CASE, ['场景', '江华市锦阳区人民法院第三法庭'], ['人物', '审判长、王律师、张律师、证人孙建平']],
    paragraphs: [
      '审判长：现在继续进行法庭调查。被告申请证人孙建平出庭作证。证人，请陈述你的姓名、工作单位和职务。',
      '证人：我叫孙建平，是瑞泽建设工程有限公司设备科科长。',
      '审判长：证人应当如实作证，故意作虚假陈述的，要承担法律责任。你听清楚了吗？',
      '证人：听清楚了。',
      '审判长：被告代理人可以向证人发问。',
      '王律师：孙科长，涉案的两台数控机床验收以后，运行情况怎么样？',
      '证人：不太好。经常停机，主轴有异响，最严重的一次停了整整三天。',
      '王律师：这些情况你们有记录吗？',
      '证人：有，都记在设备维修记录里，就是我们提交的第五组证据。',
      '王律师：审判长，我方发问完毕。',
      '审判长：原告代理人可以向证人发问。',
      '张律师：孙科长，你刚才说维修记录记载了故障情况。这份记录是谁写的？',
      '证人：是我们科的维修员写的，我签字确认。',
      '张律师：是在每次故障发生当天记录的吗？',
      '证人：基本上……是当天记录的。',
      '张律师：“基本上”是什么意思？请你正面回答。',
      '王律师：反对，审判长，原告代理人在对证人施加压力。',
      '审判长：反对无效。证人请如实回答。',
      '证人：有一部分是后来补记的。',
      '张律师：后来是什么时候？是不是在我方发出律师函之后？',
      '证人：这个……我记不太清了。',
      '张律师：审判长，我请求向证人出示原告第七组证据。孙科长，这是我方工程师的上门服务单，上面写着“故障原因：操作人员未按规程预热主轴”。下面的签字是你本人的吗？',
      '证人：是我签的。',
      '张律师：所以，至少这一次停机，原因是你们自己操作不当，而不是设备质量问题，对吗？',
      '王律师：反对，这是诱导性发问。',
      '审判长：反对有效。原告代理人请换一种方式发问。',
      '张律师：好的。孙科长，请你说明一下，服务单上记载的故障原因是什么？',
      '证人：上面写的是……操作人员未按规程预热主轴。',
      '张律师：谢谢。审判长，我方发问完毕。',
      '审判长：证人退庭。被告提交的维修记录部分系事后补记，本院将结合其他证据综合认定。',
    ],
    moments: [
      {
        p: 13,
        who: '张律师',
        cue: 'The witness says a technician wrote the log and he signed it off. Ask the question that matters: was each entry made on the day of the breakdown?',
        en: 'Was it recorded on the day each breakdown happened?',
        keys: ['当天记录'],
      },
      {
        p: 15,
        who: '张律师',
        cue: 'He hedges: “basically… on the day”. Don’t let the hedge stand — demand a straight answer.',
        en: 'What does “basically” mean? Please answer the question directly.',
        keys: ['正面回答'],
      },
      {
        p: 16,
        who: '王律师',
        cue: 'Your witness is being pressed hard. Object to the presiding judge: counsel is putting pressure on the witness.',
        en: 'Objection, your Honour — counsel for the claimant is putting pressure on the witness.',
        keys: ['反对', '施加压力'],
      },
      {
        p: 17,
        who: '审判长',
        cue: 'You are presiding. Overrule the objection and direct the witness to answer truthfully.',
        en: 'Objection overruled. The witness will answer truthfully.',
        keys: ['反对无效', '如实回答'],
      },
      {
        p: 19,
        who: '张律师',
        cue: 'He concedes some entries were written up “later”. Pin down when — and put it to him that it was after your lawyer’s letter.',
        en: 'Later when? Was it after we sent our lawyer’s letter?',
        keys: ['律师函'],
      },
      {
        p: 24,
        who: '王律师',
        cue: 'Zhang’s last question handed the witness the answer: “so it was your own operator error, wasn’t it?” Object.',
        en: 'Objection — that’s a leading question.',
        keys: ['诱导性发问'],
      },
      {
        p: 25,
        who: '审判长',
        cue: 'Sustain the objection and tell counsel to put the question another way.',
        en: 'Objection sustained. Counsel for the claimant, please rephrase the question.',
        keys: ['反对有效', '换一种方式发问'],
      },
      {
        p: 26,
        who: '张律师',
        cue: 'Your leading question was disallowed. Get the same fact out of the witness with an open question about the service report.',
        en: 'Very well. Mr Sun, please tell the court: what does the service report record as the cause of the fault?',
        keys: ['说明一下', '记载', '故障原因'],
      },
    ],
  },
  {
    id: 'dl-closing',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'Closing argument',
    titleZh: '法庭辩论',
    level: 'C1',
    summary:
      'The judge frames the two issues; each side makes its case. Watch what Zhang asks for that she will not get — the judgment that follows dismisses it.',
    meta: [CASE, ['场景', '江华市锦阳区人民法院第三法庭'], ['人物', '审判长、张律师、王律师']],
    paragraphs: [
      '审判长：法庭调查结束，现在进入法庭辩论阶段。辩论应当围绕本案争议焦点进行。本院归纳的争议焦点是：第一，被告能否以设备存在质量问题为由行使先履行抗辩权；第二，原告主张的违约金及律师费是否应予支持。先由原告发表辩论意见。',
      '张律师：审判长，合议庭。原告认为：第一，涉案设备已于二〇二三年七月十八日验收合格，验收单加盖了被告公章，被告对此并无异议。第二，被告主张设备存在质量问题，却从未在合理期限内以书面形式提出异议；其提交的维修记录部分系事后补记，证人也当庭承认至少一次停机系操作不当所致。被告的抗辩既无事实依据，也无法律依据。第三，被告逾期付款，理应按合同约定承担违约金。此外，原告为本案支出律师费十二万元，请求一并由被告承担。',
      '审判长：被告发表辩论意见。',
      '王律师：审判长，合议庭。被告认为，验收合格不等于设备不存在潜在缺陷。设备投入使用后频繁停机，原告的售后服务明显不到位，被告暂缓支付剩余价款，是依法行使先履行抗辩权。即便法庭认定被告应当付款，原告主张的违约金也明显过高，请求法庭予以调减。至于律师费，合同中并无约定由违约方承担，原告的该项请求没有依据。',
      '审判长：原告是否有新的辩论意见？',
      '张律师：只补充一点。先履行抗辩权以对方存在根本违约为前提。设备的主要功能从未丧失，被告也一直在使用这两台机床施工，何来根本违约？',
      '审判长：被告有无补充？',
      '王律师：没有补充。',
      '审判长：法庭辩论结束。下面由双方作最后陈述。原告？',
      '张律师：坚持诉讼请求。',
      '审判长：被告？',
      '王律师：请求驳回原告的全部诉讼请求。',
      '审判长：现在休庭，合议庭将进行评议，择期宣判。',
      '（判决书见“裁判文书”：买卖合同纠纷一审民事判决书）',
    ],
    moments: [
      {
        p: 0,
        who: '审判长',
        cue: 'You are presiding. Close the fact-finding, open argument, and state the two issues: whether Ruize may rely on the defence of prior performance because of quality problems, and whether the penalty and legal fees should be awarded. Then invite the claimant to begin.',
        en: 'The court investigation is concluded; we now move to argument, which should address the issues in dispute. The court has identified them as: first, whether the defendant may exercise the defence of prior performance on the ground that the equipment was defective; second, whether the penalty and lawyer’s fees claimed should be awarded. The claimant will begin.',
        keys: ['法庭辩论', '争议焦点', '先履行抗辩权'],
      },
      {
        p: 5,
        who: '张律师',
        cue: 'One point in reply. The prior-performance defence needs a fundamental breach — yet Ruize has been using both machines on its sites throughout. Make the point, and end with a rhetorical question.',
        en: 'Just one point. The defence of prior performance presupposes a fundamental breach by the other side. The machines’ main functions were never lost — the defendant has been using both on its projects all along. So where is the fundamental breach?',
        keys: ['为前提', '根本违约', '何来'],
      },
      {
        p: 9,
        who: '张律师',
        cue: 'Final statement for the claimant. Six characters will do.',
        en: 'We maintain our claims.',
        keys: ['坚持诉讼请求'],
      },
      {
        p: 11,
        who: '王律师',
        cue: 'Final statement for the respondent, in one sentence.',
        en: 'We ask the court to dismiss all of the claimant’s claims.',
        keys: ['驳回', '诉讼请求'],
      },
    ],
  },
];
