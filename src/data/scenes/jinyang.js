// 收购锦阳科技 — The Jinyang Tech deal.
//
// A transaction rather than a dispute: a buyer acquiring 60% of a founder's
// company, and the clauses it fights over. Three scenes are woven around
// three documents the app already holds, so the story moves from talk to
// paper and back:
//
//   the client strategy meeting      → Li Ming's reply on the SPA (Emails)
//   the negotiation across the table → the second-round DD list (Emails)
//   the phone call the night before signing
//                                    → the signed confidentiality and
//                                      non-compete clauses (Contracts)
//
// Every term agreed here is the term those documents contain: the second
// instalment conditioned on delivery of the closing documents, the warranty
// restored with a cap at 20% of the price, the arbitration seat conceded,
// confidentiality for five years after termination, a two-year non-compete
// limited to "相同或者具有实质性竞争关系的业务", and the RMB 5m penalty that
// survives a last-minute push to cut it.
//
// All of it is invented. 恒达 and 安泰 are the firms from the other stories.

const SPEAKERS = {
  刘总: {
    en: 'Liu Yang — investment director at Qiyuan Capital, the buyer',
    side: 'buyer',
  },
  张律师: {
    en: 'Zhang Xiaoyun — partner at Hengda, counsel for the buyer',
    side: 'buyer',
  },
  李律师: {
    en: 'Li Ming — associate at Hengda',
    side: 'buyer',
  },
  王律师: {
    en: 'Wang — Antai Law Firm, counsel for the seller',
    side: 'seller',
  },
  高总: {
    en: 'Gao Feng — founder of Jinyang Tech, the seller',
    side: 'seller',
  },
};

const DEAL = ['交易', '启源资本收购锦阳科技有限公司百分之六十股权（虚构）'];

export const story = {
  id: 'jinyang',
  titleZh: '收购锦阳科技',
  title: 'The Jinyang Tech deal',
  blurb:
    'A buyer, a proud founder and a share purchase agreement: strategy, a negotiation, a last-minute call — and the email, request list and clauses they produce.',
  parts: [
    'dl-deal-brief',
    'em-spa-comments',
    'dl-deal-table',
    'em-dd-request',
    'dl-deal-close',
    'ct-confidentiality',
  ],
};

export const docs = [
  {
    id: 'dl-deal-brief',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'Strategy — what we want, and what we can give away',
    titleZh: '交易策略会',
    level: 'B2',
    summary:
      'The seller has struck out the warranty on contingent liabilities, and due diligence has found two live lawsuits. The client wants to cut the price; his lawyer has a better idea, and a plan for which points to trade.',
    meta: [DEAL, ['场景', '恒达律师事务所会议室'], ['人物', '刘总、张律师、李律师']],
    paragraphs: [
      '刘总：张律师，卖方的修订稿我看了。最让我不舒服的是第八条：他们把或有负债的保证条款整条删掉了。',
      '张律师：我也注意到了。这不是措辞问题，是风险分配问题。尽调中发现的两起诉讼，现在都还没有了结。',
      '李律师：一起是竞争对手起诉锦阳科技专利侵权，索赔九百万；另一起是经销商合同纠纷，标的三百万左右。',
      '刘总：加起来一千二百万。要不我们干脆压价，直接从八千万里扣掉？',
      '张律师：压价是一个办法，但不一定是最好的办法。官司还没判，扣多了对方不会答应，扣少了风险又留在我们这边。比较稳妥的做法是恢复卖方的陈述与保证，再配一个赔偿条款：真出了问题，由卖方承担。',
      '刘总：赔偿有没有上限？',
      '张律师：对方一定会要求设上限。我建议我们主动提出，按转让价款的百分之二十，也就是一千六百万。两起诉讼都覆盖得住，还留有余地。',
      '刘总：那第五条付款呢？',
      '李律师：对方的稿子写的是工商变更登记完成后十个工作日内付第二期。问题是，变更登记完成了，交割文件不一定交齐。',
      '张律师：所以付款条件要加一项：卖方交付全部交割文件。钱付出去容易，再要回来就难了。',
      '刘总：仲裁那一条呢？北京还是上海，我无所谓。',
      '张律师：您无所谓，那正好。我们先提出改到上海，到了谈判桌上，这一条可以作为筹码让出去，换对方在第八条上让步。',
      '刘总：明白了，先多要一点，留出让步的空间。',
      '张律师：对。另外，竞业限制是我们的底线。稿子里写的是交割后两年，对方暂时没有提意见，但我估计高总迟早会提。不管怎么谈，两年不能少。',
      '刘总：好，就按这个思路。什么时候回复对方？',
      '张律师：今天就回。李明，你起草一封回复邮件，三点意见逐条写清楚。语气要客气，立场要坚定。最后建议周四开电话会。',
      '李律师：好的，中午之前发给您审阅。',
      '（回复邮件见“往来邮件”：关于《股权转让协议》修改意见的回复）',
    ],
    moments: [
      {
        p: 1,
        who: '张律师',
        cue: 'The client is upset that the seller struck out the contingent-liability warranty. Reframe it: this is not about wording but about who carries the risk — and the two lawsuits found in due diligence are still unresolved.',
        en: 'I noticed that too. This isn’t a drafting point — it’s about how risk is allocated. Both lawsuits we found in due diligence are still pending.',
        keys: ['风险分配', '尽调', '了结'],
      },
      {
        p: 4,
        who: '张律师',
        cue: 'He wants to knock the 12 million straight off the price. Explain why that isn’t necessarily the best route, then propose the safer one: restore the warranty and add an indemnity.',
        en: 'Cutting the price is one way, but not necessarily the best. The cases haven’t been decided: deduct too much and they won’t agree; too little and the risk stays with us. The safer course is to restore the seller’s representations and warranties and pair them with an indemnity — if something does go wrong, the seller bears it.',
        keys: ['压价', '稳妥', '陈述与保证', '赔偿条款'],
      },
      {
        p: 6,
        who: '张律师',
        cue: 'Will the indemnity be capped? Say the other side is bound to insist on a cap — so propose one yourselves: 20% of the price, 16 million, enough to cover both lawsuits with room to spare.',
        en: 'They’re certain to ask for a cap. I suggest we propose one ourselves: 20% of the purchase price, which is 16 million. That covers both lawsuits with room to spare.',
        keys: ['上限', '百分之二十', '覆盖得住', '留有余地'],
      },
      {
        p: 9,
        who: '张律师',
        cue: 'Registration can be complete before every closing document has been handed over. Say what must be added to the payment condition — and why, in one pithy line about money.',
        en: 'So the payment condition needs one more item: the seller has delivered all the closing documents. Money is easy to pay out and hard to get back.',
        keys: ['付款条件', '交割文件', '要回来'],
      },
      {
        p: 11,
        who: '张律师',
        cue: 'The client doesn’t care where the arbitration is seated. Turn that into tactics: ask for Shanghai now, and trade it away at the table for a concession on the warranty clause.',
        en: 'If you don’t mind, so much the better. We’ll ask to move it to Shanghai, and at the negotiating table we can give that up as a bargaining chip in exchange for movement on Clause 8.',
        keys: ['筹码', '让出去', '让步'],
      },
      {
        p: 15,
        who: '张律师',
        cue: 'Instruct your associate: reply today, three points clause by clause, polite in tone and firm in substance, and propose a call on Thursday.',
        en: 'Today. Li Ming, draft a reply setting out our three points one by one. Polite in tone, firm in position. And propose a call on Thursday.',
        keys: ['逐条', '语气要客气', '立场要坚定'],
      },
    ],
  },
  {
    id: 'dl-deal-table',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'Across the table — the warranty and the non-compete',
    titleZh: '谈判桌上',
    level: 'B2+',
    summary:
      'The call becomes a meeting. The founder takes the warranty personally; counsel offers a 10% cap. Zhang trades the arbitration seat and the claims period for 20% — and defuses the non-compete with one word in the drafting.',
    meta: [DEAL, ['场景', '安泰律师事务所会议室'], ['人物', '王律师、高总、张律师、刘总、李律师']],
    paragraphs: [
      '王律师：张律师，贵所周一的意见我们收到了。先说结论：第五条的付款条件，我方可以接受；仲裁地，我们希望保留北京；分歧最大的是第八条。',
      '张律师：谢谢王律师。那我们就集中谈第八条。',
      '高总：我先说两句。锦阳科技是我一手做起来的，账目清清楚楚。那两个官司，一个是对手恶意诉讼，一个是经销商自己违约。凭什么要我个人兜底？',
      '张律师：高总，我们完全理解，也并不怀疑您的诚信。陈述与保证的作用是分配风险，而不是指责谁。如果诉讼真像您说的那样没有问题，这个条款对您没有任何成本。',
      '高总：话是这么说，可万一法院判错了呢？',
      '张律师：正因为有这个“万一”，才需要有人承担。问题只是由谁承担：是最了解公司的卖方，还是刚刚进门的买方？',
      '王律师：张律师，我方可以考虑恢复保证条款，但赔偿必须设上限，而且上限不能超过转让价款的百分之十。',
      '刘总：百分之十才八百万，连专利那一个案子都不够。',
      '张律师：王律师，两起诉讼的标的加起来是一千二百万。上限定在百分之十，等于说风险的一大半还是留给买方。这一点我们无法接受。',
      '王律师：那贵方的底线是多少？',
      '张律师：百分之二十。不过，为了表示诚意，仲裁地可以按贵方的意见，保留北京。',
      '王律师：仲裁地是小事，换不来百分之二十。我方最多接受百分之十五，而且索赔期限只能是交割后十八个月。',
      '张律师：索赔期限十八个月，我方可以接受。但上限必须是百分之二十。两个让步换一个，这已经很有诚意了。',
      '高总：（沉默片刻）行，百分之二十就百分之二十。但是竞业限制我也有话说：两年太长了。我还有一家做硬件的公司，难道也要关掉？',
      '张律师：高总，竞业限制只限制与锦阳科技主营业务相同或者具有实质性竞争关系的业务。您那家公司做硬件，如果和锦阳科技不构成竞争，本来就不受限制。',
      '高总：这句话能写进合同吗？',
      '张律师：可以。条款里就写“相同或者具有实质性竞争关系的业务”，范围很清楚。期限两年不变。',
      '王律师：好，原则上同意。不过那两起诉讼的情况，我方建议贵方再做一轮尽调，免得以后各说各话。',
      '张律师：同意。我们尽快安排现场访谈，访谈之后发第二批资料清单。我总结一下今天的共识：第五条按我方的修改意见；第八条恢复保证条款，赔偿上限为转让价款的百分之二十，索赔期限为交割后十八个月；仲裁地保留北京；竞业限制两年，限于相同或者具有实质性竞争关系的业务。会后由我方整理会议纪要，发双方确认。',
      '王律师：没问题。',
      '（第二批资料清单见“往来邮件”：尽职调查补充资料清单（第二批））',
    ],
    moments: [
      {
        p: 1,
        who: '张律师',
        cue: 'Opposing counsel accepts your payment point, wants to keep Beijing, and says the warranty clause is the big gap. Steer the meeting: thank him, and say you will concentrate on that clause.',
        en: 'Thank you, Mr Wang. Then let’s concentrate on Clause 8.',
        keys: ['集中谈'],
      },
      {
        p: 3,
        who: '张律师',
        cue: 'The founder takes it personally: “Why should I underwrite this myself?” Defuse it — you don’t doubt his integrity; warranties allocate risk, they don’t accuse anyone — and if the suits really are baseless, the clause costs him nothing.',
        en: 'Mr Gao, we entirely understand, and we don’t doubt your integrity. Warranties are there to allocate risk, not to accuse anyone. If the lawsuits really are as groundless as you say, this clause costs you nothing.',
        keys: ['诚信', '分配风险', '没有任何成本'],
      },
      {
        p: 5,
        who: '张律师',
        cue: '“But what if the court gets it wrong?” Use his own worry: that “what if” is exactly why someone has to bear the risk. The only question is who — the seller who knows the company best, or the buyer just walking in the door?',
        en: 'It’s precisely because of that “what if” that someone has to bear the risk. The only question is who: the seller, who knows the company best, or the buyer, who has only just walked in the door?',
        keys: ['万一', '承担', '刚刚进门'],
      },
      {
        p: 6,
        who: '王律师',
        cue: 'You act for the seller. Give ground on restoring the warranty — but only with a cap on the indemnity, and no higher than 10% of the price.',
        en: 'Ms Zhang, we can consider restoring the warranty, but the indemnity must be capped — and the cap can’t exceed 10% of the purchase price.',
        keys: ['可以考虑', '设上限', '不能超过'],
      },
      {
        p: 8,
        who: '张律师',
        cue: 'They offer a 10% cap. Show with the numbers why that leaves most of the risk with the buyer — and reject it.',
        en: 'Mr Wang, the two lawsuits together are worth 12 million. A cap of 10% means most of the risk stays with the buyer. That we cannot accept.',
        keys: ['标的', '一大半', '无法接受'],
      },
      {
        p: 10,
        who: '张律师',
        cue: 'Asked for your bottom line, give it — 20% — and play the chip you prepared: as a gesture of good faith, the arbitration can stay in Beijing.',
        en: 'Twenty per cent. But as a sign of good faith, we can agree to your position on the seat — the arbitration stays in Beijing.',
        keys: ['表示诚意', '保留北京'],
      },
      {
        p: 12,
        who: '张律师',
        cue: 'They offer 15% and an 18-month claims period. Accept the 18 months, hold firm on 20%, and point out that you have now made two concessions for one.',
        en: 'An 18-month claims period we can accept. But the cap has to be 20%. Two concessions for one — that is already very generous.',
        keys: ['索赔期限', '两个让步换一个'],
      },
      {
        p: 14,
        who: '张律师',
        cue: 'The founder fears the non-compete will close his hardware business. Explain the scope: it bites only on business the same as, or in substantial competition with, Jinyang’s main business.',
        en: 'Mr Gao, the non-compete only restricts business that is the same as, or in substantial competition with, Jinyang Tech’s main business. If your hardware company doesn’t compete with Jinyang, it isn’t restricted at all.',
        keys: ['主营业务', '实质性竞争关系', '不受限制'],
      },
      {
        p: 18,
        who: '张律师',
        cue: 'Agree to the further due diligence, then close the meeting: summarise what has been agreed, clause by clause, and say your side will circulate minutes for both parties to confirm.',
        en: 'Agreed. We’ll arrange a site interview as soon as possible and send a second request list afterwards. Let me summarise what we agreed today: Clause 5 follows our amendment; Clause 8 restores the warranty, with the indemnity capped at 20% of the price and claims limited to 18 months after closing; the seat stays in Beijing; the non-compete runs two years and covers only business that is the same or in substantial competition. We’ll prepare minutes after the meeting and send them to both sides to confirm.',
        keys: ['总结', '共识', '会议纪要'],
      },
    ],
  },
  {
    id: 'dl-deal-close',
    dialogue: true,
    speakers: SPEAKERS,
    title: 'The night before signing',
    titleZh: '签约前夜',
    level: 'C1',
    summary:
      'Counsel rings late with “two small points”: shorten confidentiality, cut the non-compete penalty. Zhang refuses to call the penalty a detail, takes instructions, and offers a package that cannot be split.',
    meta: [DEAL, ['场景', '电话'], ['人物', '王律师、张律师、刘总']],
    paragraphs: [
      '王律师：张律师，这么晚打扰您。明天就签约了，高总那边还有两个小问题，想跟您再确认一下。',
      '张律师：王律师请讲。不过我先说一句：签约前一天再改核心条款，恐怕不太合适。',
      '王律师：不是核心条款，都是细节。第一，保密义务。贵方的稿子写的是“永久有效”，高总觉得不合理，希望改成三年。',
      '张律师：保密期限，我们可以谈。第二个问题呢？',
      '王律师：第二，竞业限制的违约金五百万，高总认为太高，希望降到两百万；另外，“违约金不足以弥补损失的，还应就不足部分予以赔偿”这一句，希望删掉。',
      '张律师：王律师，这可不是细节。违约金是竞业限制条款真正起约束作用的地方。降到两百万，再删掉补足的部分，这个条款就形同虚设了。',
      '王律师：高总的意思是，他根本没打算竞争，这个数字只是面子问题。',
      '张律师：既然他不打算竞争，违约金是五百万还是两百万，对他就没有任何影响。反过来，对买方来说，这恰恰是整笔交易的保障。',
      '王律师：那保密期限呢？贵方能让多少？',
      '张律师：我需要跟客户确认一下。您稍等，我十分钟后回您电话。',
      '（张律师给刘总打电话）',
      '张律师：刘总，对方想把保密期限从永久改成三年，竞业限制的违约金从五百万降到两百万。',
      '刘总：违约金不能动。保密期限你看呢？',
      '张律师：永久保密在实践中本来就很难执行。我建议让到五年，也就是协议终止或者解除后五年。用这一步，换对方不再碰违约金。',
      '刘总：可以，就这么办。',
      '（十分钟后）',
      '张律师：王律师，我方的最终立场是：保密期限改为协议终止或者解除后五年；竞业限制的违约金维持五百万，补足的部分保留。这是一揽子方案，不能拆开。',
      '王律师：明白，我跟高总沟通一下。……高总同意了。',
      '张律师：好。那今晚李明出最终稿，明天上午十点，按原计划签约。',
      '王律师：辛苦了，明天见。',
      '（签署版本的第九条、第十条见“合同条款”：保密义务与竞业限制条款）',
    ],
    moments: [
      {
        p: 1,
        who: '张律师',
        cue: 'Opposing counsel rings the night before signing with “two small points”. Before you hear them, set the frame: reopening core terms the day before signing isn’t appropriate.',
        en: 'Go ahead, Mr Wang. But let me say one thing first: changing core terms the day before signing is hardly appropriate.',
        keys: ['签约前一天', '核心条款', '不太合适'],
      },
      {
        p: 5,
        who: '张律师',
        cue: 'He wants the RMB 5m penalty cut to 2m and the top-up damages sentence deleted, and calls it “detail”. Refuse the label: the penalty is what gives the non-compete its force — without it the clause exists only on paper.',
        en: 'Mr Wang, this is no detail. The penalty is what actually gives the non-compete its force. Cut it to two million and delete the top-up, and the clause exists in name only.',
        keys: ['约束作用', '形同虚设'],
      },
      {
        p: 7,
        who: '张律师',
        cue: '“He has no intention of competing — the number is just about face.” Turn his own argument round on him.',
        en: 'If he doesn’t intend to compete, it makes no difference to him whether the penalty is five million or two. For the buyer, on the other hand, it is precisely what protects the whole deal.',
        keys: ['既然', '没有任何影响', '保障'],
      },
      {
        p: 9,
        who: '张律师',
        cue: 'Don’t concede anything on the call. Say you need to check with your client and will ring back in ten minutes.',
        en: 'I need to check with my client. Bear with me — I’ll call you back in ten minutes.',
        keys: ['跟客户确认', '回您电话'],
      },
      {
        p: 13,
        who: '张律师',
        cue: 'Advise your client: perpetual confidentiality is hard to enforce in practice anyway. Recommend conceding five years from termination — and using that step to keep the penalty untouched.',
        en: 'Perpetual confidentiality is hard to enforce in practice anyway. I’d suggest conceding five years — five years after the agreement terminates or is rescinded — and using that to stop them touching the penalty.',
        keys: ['很难执行', '让到五年', '不再碰'],
      },
      {
        p: 16,
        who: '张律师',
        cue: 'Ring back with your final position: confidentiality for five years after termination; the 5m penalty and the top-up stay. Make clear it is a package that cannot be split.',
        en: 'Mr Wang, our final position: confidentiality runs for five years after the agreement terminates or is rescinded; the non-compete penalty stays at five million, and the top-up stays. It’s a package — it can’t be split.',
        keys: ['最终立场', '一揽子方案', '不能拆开'],
      },
    ],
  },
];
