// 周静诉远见 — Zhou v Yuanjian.
//
// An employee dismissed for "serious breach of the company rules", followed
// from the meeting where she is handed the notice to the appeal hearing. It
// ends in a document the app already holds: the second-instance judgment in
// Judgments, where she appears, anonymised as courts publish them, as 周某某.
//
// The arc is the lesson. At arbitration she represents herself and argues the
// facts — was she really late? — and loses. Her lawyer then moves the fight to
// procedure: a handbook never put to the staff or published to her, and a
// dismissal the union was never told about. On that ground she wins at first
// instance, and the appeal turns on exactly the three questions the judgment
// answers.
//
// The procedure follows PRC law as it stands: arbitration before litigation,
// 15 days to sue after a non-final award, the employer's burden of proof on
// its own rules, prior notice to the union before a unilateral dismissal, and
// compensation at twice the statutory severance rate. The people, company and
// facts are invented.

const SPEAKERS = {
  周静: {
    en: 'Zhou Jing — product manager at Yuanjian, dismissed (周某某 in the judgment)',
    side: 'employee',
  },
  赵经理: {
    en: 'Zhao — HR manager at Yuanjian',
    side: 'employer',
  },
  何律师: {
    en: 'He — counsel for Yuanjian',
    side: 'employer',
  },
  仲裁员: {
    en: 'Presiding arbitrator, labour dispute arbitration commission',
    side: 'neutral',
  },
  林律师: {
    en: 'Lin Lan — employment lawyer, acting for Zhou from the court stage',
    side: 'employee',
  },
  审判长: {
    en: 'Presiding judge, Jianghua Intermediate People’s Court',
    side: 'neutral',
  },
};

const CASE = ['案件', '周静与远见信息技术（江华）有限公司劳动争议（虚构）'];

export const story = {
  id: 'yuanjian',
  titleZh: '周静诉远见',
  title: 'Zhou v Yuanjian',
  blurb:
    'A dismissal for “serious misconduct”: the meeting, an arbitration lost on the facts, a lawyer who finds the procedural flaw, and the appeal.',
  parts: ['dl-dismissal', 'dl-labour-arb', 'dl-labour-lawyer', 'dl-labour-appeal', 'jg-labour-appeal'],
};

export const docs = [
  {
    id: 'dl-dismissal',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'The dismissal meeting',
    titleZh: '解除谈话',
    level: 'B2',
    summary:
      'HR hands Zhou a termination notice for lateness and missed targets under the staff handbook. She has never seen the handbook — and asks whether the union was told.',
    meta: [CASE, ['场景', '远见公司小会议室'], ['人物', '赵经理、周静']],
    paragraphs: [
      '赵经理：周静，请坐。今天找你来，是想当面通知你一个决定。',
      '周静：什么决定？',
      '赵经理：公司决定，自今天起解除与你的劳动合同。这是解除通知书。',
      '周静：解除？理由是什么？',
      '赵经理：过去三个月，你迟到早退十三次，第二季度的绩效目标也没有完成。根据《员工手册》第三十二条，这属于严重违反公司规章制度，公司可以直接解除，不支付经济补偿。',
      '周静：迟到？赵经理，那几次都是因为前一天晚上上线，加班到凌晨。吴总监当时同意我第二天晚点来，微信上说得清清楚楚。',
      '赵经理：口头同意不等于书面审批。考勤系统里记录的就是迟到。',
      '周静：那公司之前给过我书面警告吗？一次都没有。今天突然说我严重违纪？',
      '赵经理：《员工手册》里写得很明白，迟到早退累计十次以上即属严重违纪，不需要事先警告。',
      '周静：《员工手册》？我入职的时候没有人给过我，我也从来没有签过字。',
      '赵经理：手册一直放在公司内网上，所有员工都可以看。',
      '周静：放在内网上，不等于告知了我。还有，公司解除劳动合同，通知工会了吗？',
      '赵经理：这是公司的人事决定，不需要工会同意。',
      '周静：不是同意，是通知。法律规定，用人单位单方解除劳动合同，应当事先将理由通知工会。',
      '赵经理：……这个问题我会向法务确认。今天请你先把这份离职交接确认书签了。',
      '周静：我不会签。解除通知书我收下，但我不同意公司的解除决定。我会申请劳动仲裁。',
      '赵经理：这是你的权利。工作交接请在本周五之前完成。',
    ],
    moments: [
      {
        p: 5,
        who: '周静',
        cue: 'You are accused of persistent lateness. Explain: each time you had been working past midnight on a release, and your director agreed you could come in late — it’s there in writing on WeChat.',
        en: 'Late? Ms Zhao, every one of those times was because we’d gone live the night before and I’d worked until the small hours. Director Wu agreed I could come in later the next day — it’s all there on WeChat.',
        keys: ['加班', '同意', '清清楚楚'],
      },
      {
        p: 7,
        who: '周静',
        cue: 'HR says verbal approval isn’t written approval. Hit back: has the company ever given you a written warning? Not once — and now, out of nowhere, it’s “serious misconduct”?',
        en: 'Then has the company ever given me a written warning? Not once. And today, out of nowhere, I’m guilty of serious misconduct?',
        keys: ['书面警告', '严重违纪'],
      },
      {
        p: 11,
        who: '周静',
        cue: 'HR says the handbook was on the intranet for everyone. Answer that putting it online isn’t informing you — then ask whether the union was notified of the dismissal.',
        en: 'Putting it on the intranet isn’t the same as informing me. And another thing: did the company notify the union before terminating my contract?',
        keys: ['不等于', '告知', '通知工会'],
      },
      {
        p: 12,
        who: '赵经理',
        cue: 'You are HR. She asks whether the union was told. Brush it off: this is a personnel decision and doesn’t need the union’s agreement.',
        en: 'This is a personnel decision by the company. It doesn’t need the union’s agreement.',
        keys: ['人事决定', '工会同意'],
      },
      {
        p: 13,
        who: '周静',
        cue: '“It doesn’t need the union’s agreement.” Correct her: not agreement — notification. Then state the rule.',
        en: 'Not agreement — notification. The law says that when an employer terminates a contract unilaterally, it must notify the union of the reasons in advance.',
        keys: ['不是同意，是通知', '单方解除', '事先', '通知工会'],
      },
      {
        p: 15,
        who: '周静',
        cue: 'She wants you to sign a handover confirmation. Refuse. Accept the notice itself while making clear you don’t accept the decision — and say what you will do next.',
        en: 'I won’t sign. I’ll take the termination notice, but I don’t accept the company’s decision. I’m going to apply for labour arbitration.',
        keys: ['收下', '不同意', '劳动仲裁'],
      },
    ],
  },
  {
    id: 'dl-labour-arb',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'Labour arbitration — fighting on the wrong ground',
    titleZh: '劳动仲裁',
    level: 'B2+',
    summary:
      'Without a lawyer, Zhou argues the facts: the lateness was approved. She can prove two occasions of thirteen. When the arbitrator asks about the handbook, she lets the moment pass — and loses.',
    meta: [CASE, ['场景', '江华市劳动人事争议仲裁委员会仲裁庭'], ['人物', '仲裁员、周静、何律师']],
    paragraphs: [
      '仲裁员：现在开庭。申请人周静，被申请人远见信息技术（江华）有限公司。申请人，请陈述你的仲裁请求。',
      '周静：我请求裁决被申请人违法解除劳动合同，支付违法解除劳动合同的赔偿金。',
      '仲裁员：事实和理由？',
      '周静：我在公司工作了四年，一直表现很好。公司说我迟到早退，可是那几次都是因为加班，吴总监同意过的。我这里有微信聊天记录。',
      '仲裁员：被申请人答辩。',
      '何律师：仲裁员，被申请人认为解除合法。第一，考勤记录显示，申请人三个月内迟到早退十三次；第二，申请人第二季度绩效未达标；第三，依据《员工手册》第三十二条，迟到早退累计十次以上属于严重违纪。公司解除劳动合同，事实清楚，依据充分。',
      '仲裁员：申请人，你对考勤记录有没有异议？',
      '周静：记录本身……我不否认。但那是加班以后，领导同意的。',
      '仲裁员：微信记录里，吴总监同意的是哪几天？',
      '周静：有两次是在微信上说的。其他几次，我们是当面说的。',
      '何律师：仲裁员，十三次当中，只有两次有书面依据。扣除这两次，仍有十一次，同样达到了严重违纪的标准。',
      '仲裁员：申请人，对被申请人提交的《员工手册》，你有什么意见？',
      '周静：我……没有仔细看过。不过我觉得，加班的情况公司应该考虑。',
      '仲裁员：好。双方是否愿意调解？',
      '何律师：被申请人不同意调解。',
      '周静：我也不同意。',
      '仲裁员：庭审到此结束。仲裁庭将在法定期限内作出裁决。',
      '（一个月后，仲裁委员会作出裁决：驳回申请人的仲裁请求。周静委托林律师，准备向人民法院起诉。）',
    ],
    moments: [
      {
        p: 0,
        who: '仲裁员',
        cue: 'You are the arbitrator. Open the hearing, name the applicant and the respondent, and ask the applicant to state her claim.',
        en: 'The hearing is open. The applicant, Zhou Jing; the respondent, Yuanjian Information Technology (Jianghua) Co., Ltd. Applicant, please state your claim.',
        keys: ['开庭', '申请人', '仲裁请求'],
      },
      {
        p: 1,
        who: '周静',
        cue: 'State your claim in one sentence: an award that the dismissal was unlawful, and compensation for unlawful termination.',
        en: 'I ask for an award that the respondent unlawfully terminated my employment contract and must pay compensation for unlawful termination.',
        keys: ['违法解除劳动合同', '赔偿金'],
      },
      {
        p: 5,
        who: '何律师',
        cue: 'You are the company’s counsel. Put the defence in three numbered points — attendance records, missed targets, the handbook rule — and finish by saying the dismissal is factually clear and well founded.',
        en: 'The respondent maintains the termination was lawful. First, attendance records show thirteen late arrivals or early departures in three months; second, she missed her Q2 performance targets; third, under Article 32 of the staff handbook, ten or more counts as serious misconduct. The facts are clear and the basis is sound.',
        keys: ['考勤记录', '绩效', '事实清楚，依据充分'],
      },
      {
        p: 8,
        who: '仲裁员',
        cue: 'Test her evidence: which days, exactly, did the director approve in his WeChat messages?',
        en: 'In the WeChat messages, which days did Director Wu approve?',
        keys: ['哪几天'],
      },
      {
        p: 10,
        who: '何律师',
        cue: 'She can document only two of the thirteen. Do the arithmetic out loud: take those two away and she is still over the threshold.',
        en: 'Of the thirteen occasions, only two have any written support. Take those two away and there are still eleven — which still meets the standard for serious misconduct.',
        keys: ['书面依据', '扣除', '仍有'],
      },
    ],
  },
  {
    id: 'dl-labour-lawyer',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'A lawyer changes the ground',
    titleZh: '律师会见：换个打法',
    level: 'C1',
    summary:
      'Zhou thinks it is over. Her new lawyer explains that arbitration is only the first step — and that the case was never about whether she was late.',
    meta: [CASE, ['场景', '林律师办公室'], ['人物', '周静、林律师']],
    paragraphs: [
      '周静：林律师，仲裁输了。是不是没希望了？',
      '林律师：别着急。劳动争议是仲裁前置，仲裁只是第一步。你收到裁决书之日起十五日内，可以向法院起诉，案子会重新审理。',
      '周静：可是迟到的次数，我确实否认不了。',
      '林律师：问题就在这里。仲裁的时候，你一直在争迟到是不是事实。可这个案子的关键不在事实，在程序。',
      '周静：程序？',
      '林律师：公司以严重违反规章制度为由解除，就要证明三件事：规章制度本身合法有效，你的行为确实严重，解除程序也正当。这三点的举证责任都在公司。',
      '周静：《员工手册》不算规章制度吗？',
      '林律师：算，但前提是制定程序合法。涉及劳动者切身利益的规章制度，应当经过职工代表大会或者全体职工讨论，还要向劳动者公示或者告知。你入职的时候签过收吗？',
      '周静：没有。手册只是放在内网上。',
      '林律师：公司有没有工会？',
      '周静：有，工会主席是行政部的老刘。',
      '林律师：解除之前，公司有没有书面通知过工会？',
      '周静：赵经理说不需要工会同意。我问过她，她答不上来。',
      '林律师：那就是我们的突破口。第一，《员工手册》没有经过民主程序，也没有向你公示；第二，解除前没有通知工会。只要这两点成立，即使迟到是事实，解除也是违法的。',
      '周静：那赔偿金怎么算？',
      '林律师：违法解除的，按经济补偿标准的二倍支付赔偿金。你工作了四年，原则上就是八个月的工资。',
      '周静：我明白了。我们起诉。',
      '（一审法院判决远见公司构成违法解除，应当支付赔偿金。远见公司不服，向江华市中级人民法院提起上诉。）',
    ],
    moments: [
      {
        p: 1,
        who: '林律师',
        cue: 'Your client thinks losing the arbitration is the end. Reassure her: in labour disputes arbitration is a compulsory first step; she has 15 days from receiving the award to sue, and the court hears the case afresh.',
        en: 'Don’t worry. In labour disputes, arbitration has to come first — it’s only step one. Within 15 days of receiving the award you can sue in court, and the case will be heard afresh.',
        keys: ['仲裁前置', '十五日内', '重新审理'],
      },
      {
        p: 3,
        who: '林律师',
        cue: 'She says she can’t deny the lateness. Tell her that is exactly the problem: at arbitration she fought over the facts — but this case turns on procedure.',
        en: 'That’s exactly the problem. At arbitration you kept arguing about whether you were really late. But the key to this case isn’t the facts — it’s the procedure.',
        keys: ['问题就在这里', '关键不在事实，在程序'],
      },
      {
        p: 5,
        who: '林律师',
        cue: 'Explain what an employer dismissing for serious breach of its rules must prove — three things — and on whom the burden lies.',
        en: 'If the company dismisses you for seriously breaching its rules, it has to prove three things: that the rules themselves are lawful and valid, that your conduct really was serious, and that the dismissal procedure was proper. The burden of proof on all three is on the company.',
        keys: ['合法有效', '解除程序', '举证责任'],
      },
      {
        p: 7,
        who: '林律师',
        cue: 'Yes, a handbook counts as company rules — but only if properly made. Explain the two requirements (staff congress or all-staff discussion; publication or notice to employees) and ask whether she ever signed for it.',
        en: 'It does — but only if it was made by a lawful procedure. Rules that affect employees’ vital interests must be discussed by the staff congress or all employees, and published or notified to them. Did you sign for it when you joined?',
        keys: ['切身利益', '职工代表大会', '公示', '签过收'],
      },
      {
        p: 13,
        who: '林律师',
        cue: 'Sum up the breakthrough: two procedural defects — and why they win the case even if the lateness is true.',
        en: 'That’s our way in. First, the handbook never went through a democratic procedure and was never published to you. Second, the union wasn’t notified before the dismissal. If those two points hold, the dismissal is unlawful even if the lateness is true.',
        keys: ['突破口', '民主程序', '即使'],
      },
      {
        p: 15,
        who: '林律师',
        cue: 'How is the compensation calculated? Twice the statutory severance — which, for four years’ service, is in principle eight months’ pay.',
        en: 'For an unlawful dismissal, compensation is twice the statutory severance. You worked there four years, so in principle that’s eight months’ salary.',
        keys: ['二倍', '赔偿金', '八个月'],
      },
    ],
  },
  {
    id: 'dl-labour-appeal',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'The appeal — three questions',
    titleZh: '二审庭审',
    level: 'C1',
    summary:
      'The company appeals. The presiding judge asks three questions — how the handbook was made, whether it was served, whether the union was told — and the answers write the judgment.',
    meta: [CASE, ['场景', '江华市中级人民法院'], ['人物', '审判长、何律师、林律师']],
    paragraphs: [
      '审判长：现在开庭。本案为二审案件，本院围绕上诉请求进行审理。上诉人，请简要陈述上诉请求和理由。',
      '何律师：审判长，上诉人请求撤销一审判决，依法改判驳回被上诉人的诉讼请求。理由是：被上诉人多次迟到早退，绩效未达标，严重违反公司规章制度，公司解除劳动合同合法。一审判决认定事实不清。',
      '审判长：被上诉人答辩。',
      '林律师：审判长，被上诉人认为一审判决正确。公司从未就考勤问题向被上诉人发出书面警告；《员工手册》未经民主程序制定，也未向被上诉人公示，不能作为解除依据。请求驳回上诉，维持原判。',
      '审判长：上诉人，本院有几个问题。第一，《员工手册》是如何制定的？是否经过职工代表大会或者全体职工讨论？',
      '何律师：《员工手册》是公司管理层讨论通过的，并在内网上公布。',
      '审判长：也就是说，没有经过职工代表大会讨论，对吗？',
      '何律师：……没有召开职工代表大会。但手册的内容并无违法之处。',
      '审判长：内容是否违法是一个问题，程序是否合法是另一个问题。第二，被上诉人是否签收过《员工手册》？有无送达或者公示的证据？',
      '何律师：没有签收记录。内网的访问记录，公司没有保存。',
      '审判长：第三，解除劳动合同之前，公司是否将解除理由通知工会？',
      '何律师：工会主席当时是知情的。',
      '林律师：审判长，“知情”不等于“通知”。法律要求的是用人单位事先将理由通知工会，上诉人至今没有提交任何书面通知。',
      '审判长：上诉人，有没有书面通知工会的证据？',
      '何律师：……没有书面证据。',
      '审判长：好。双方是否愿意调解？',
      '何律师：如果被上诉人愿意降低赔偿金额，上诉人可以考虑。',
      '林律师：被上诉人只要求依法支付赔偿金，不同意降低。',
      '审判长：调解不成。下面由双方作最后陈述。上诉人？',
      '何律师：坚持上诉请求。',
      '审判长：被上诉人？',
      '林律师：请求驳回上诉，维持原判。',
      '审判长：现在休庭。合议庭评议后择期宣判。',
      '（判决书见“裁判文书”：劳动争议二审民事判决书）',
    ],
    moments: [
      {
        p: 1,
        who: '何律师',
        cue: 'You act for the company, now the appellant. State the appeal — set aside the first-instance judgment, re-decide, dismiss her claims — give the grounds in one breath, and end with the first-instance court’s error.',
        en: 'Your Honour, the appellant asks the court to set aside the first-instance judgment and, on re-decision, dismiss the respondent’s claims. The grounds: the respondent was repeatedly late or left early and missed her targets, seriously breaching company rules, so the termination was lawful. The first-instance judgment got the facts wrong.',
        keys: ['撤销一审判决', '改判', '认定事实不清'],
      },
      {
        p: 3,
        who: '林律师',
        cue: 'Reply for the employee: no written warning ever; the handbook neither democratically adopted nor published to her, so it cannot ground a dismissal. Ask for the appeal to be dismissed and the judgment upheld.',
        en: 'Your Honour, the respondent submits that the first-instance judgment is correct. The company never issued her a written warning about attendance; the handbook was neither adopted through a democratic procedure nor published to her, so it cannot be a basis for dismissal. We ask that the appeal be dismissed and the original judgment upheld.',
        keys: ['书面警告', '民主程序', '驳回上诉，维持原判'],
      },
      {
        p: 6,
        who: '审判长',
        cue: 'Counsel says management adopted the handbook and posted it on the intranet. Pin him down: so it never went to a staff congress — correct?',
        en: 'In other words, it was not discussed by a staff congress — correct?',
        keys: ['也就是说', '对吗'],
      },
      {
        p: 8,
        who: '审判长',
        cue: 'He says the content is lawful anyway. Separate the two questions — content and procedure — then ask your second: did she ever sign for the handbook, and is there evidence it was served or published?',
        en: 'Whether the content is unlawful is one question; whether the procedure was lawful is another. Second: did the respondent ever sign for the handbook? Is there any evidence of service or publication?',
        keys: ['是另一个问题', '签收', '送达', '公示'],
      },
      {
        p: 12,
        who: '林律师',
        cue: '“The union chairman knew about it.” Knock that down: knowing is not notification — the law requires prior notice of the reasons, and the company has produced nothing in writing.',
        en: 'Your Honour, “knew” is not “notified”. The law requires the employer to notify the union of the reasons in advance, and the appellant has still not produced any written notice.',
        keys: ['知情', '不等于', '通知工会'],
      },
      {
        p: 17,
        who: '林律师',
        cue: 'The company will “consider” settling if your client takes less. Decline: she asks only for what the law provides.',
        en: 'The respondent asks only for the compensation the law provides, and does not agree to any reduction.',
        keys: ['依法', '不同意降低'],
      },
    ],
  },
];
