import type { ToeflQuestion, ToeflQuestionType } from '../types'

export type { ToeflQuestionType }

export const TOEFL_QUESTION_TYPES: Record<ToeflQuestionType, { label: string; color: string }> = {
  vocab: { label: '词汇', color: '#2563eb' },
  grammar: { label: '语法', color: '#7c3aed' },
  sentence: { label: '句子填空', color: '#0f766e' },
  reading: { label: '短阅读', color: '#d97706' },
}

export const TOEFL_QUESTIONS: ToeflQuestion[] = [
  // ---------- 词汇（15 题） ----------
  {
    id: 't001',
    type: 'vocab',
    prompt: 'The word "meticulous" is closest in meaning to which of the following?',
    options: ['Careless', 'Very careful', 'Rapid', 'Rude'],
    answerIndex: 1,
    explanation:
      'meticulous 意为"一丝不苟的、极其细心的"，与 very careful 同义。careless（粗心）、rapid（快速的）、rude（粗鲁的）均不符合。',
  },
  {
    id: 't002',
    type: 'vocab',
    prompt: 'The word "adverse" is closest in meaning to which of the following?',
    options: ['Favorable', 'Unfavorable', 'Obvious', 'Minor'],
    answerIndex: 1,
    explanation:
      'adverse 意为"不利的、有害的"（如 adverse weather 恶劣天气），对应 unfavorable。favorable 是反义词，obvious（明显的）、minor（次要的）均不匹配。',
  },
  {
    id: 't003',
    type: 'vocab',
    prompt: 'The word "ubiquitous" is closest in meaning to which of the following?',
    options: ['Rare', 'Found everywhere', 'Expensive', 'Outdated'],
    answerIndex: 1,
    explanation:
      'ubiquitous 意为"无处不在的"（如 Smartphones are ubiquitous 智能手机无处不在），对应 found everywhere。',
  },
  {
    id: 't004',
    type: 'vocab',
    prompt: 'The word "facilitate" is closest in meaning to which of the following?',
    options: ['Hinder', 'Make easier', 'Delay', 'Ignore'],
    answerIndex: 1,
    explanation:
      'facilitate 意为"促进、使……更容易"（如 facilitate communication 促进交流），对应 make easier。hinder（阻碍）是其反义词。',
  },
  {
    id: 't005',
    type: 'vocab',
    prompt: 'The word "ambiguous" is closest in meaning to which of the following?',
    options: ['Clear', 'Unclear', 'Brief', 'Strong'],
    answerIndex: 1,
    explanation:
      'ambiguous 意为"模棱两可的、含糊不清的"，对应 unclear。clear 是其反义词，brief（简短的）、strong（强烈的）不匹配。',
  },
  {
    id: 't006',
    type: 'vocab',
    prompt: 'The word "mitigate" is closest in meaning to which of the following?',
    options: ['Worsen', 'Lessen', 'Measure', 'Ignore'],
    answerIndex: 1,
    explanation:
      'mitigate 意为"减轻、缓和"（如 mitigate the damage 减轻损失），对应 lessen。worsen（恶化）是其反义词。',
  },
  {
    id: 't007',
    type: 'vocab',
    prompt: 'The word "tenacious" is closest in meaning to which of the following?',
    options: ['Persistent', 'Timid', 'Indifferent', 'Generous'],
    answerIndex: 0,
    explanation:
      'tenacious 意为"坚韧不拔的、执着的"（如 a tenacious fighter），对应 persistent（坚持的）。timid（胆小的）、indifferent（漠不关心的）不符。',
  },
  {
    id: 't008',
    type: 'vocab',
    prompt: 'The word "elaborate" is closest in meaning to which of the following?',
    options: ['Simple', 'Detailed', 'Ancient', 'Hidden'],
    answerIndex: 1,
    explanation:
      'elaborate 作形容词意为"精心制作的、详尽的"（如 an elaborate plan 周密的计划），对应 detailed。',
  },
  {
    id: 't009',
    type: 'vocab',
    prompt: 'The word "scarcity" is closest in meaning to which of the following?',
    options: ['Abundance', 'Shortage', 'Variety', 'Quality'],
    answerIndex: 1,
    explanation:
      'scarcity 意为"缺乏、不足"（如 water scarcity 水资源短缺），对应 shortage。abundance（丰富）是其反义词。',
  },
  {
    id: 't010',
    type: 'vocab',
    prompt: 'The word "coherent" is closest in meaning to which of the following?',
    options: ['Logically consistent', 'Completely original', 'Extremely long', 'Hard to read'],
    answerIndex: 0,
    explanation:
      'coherent 意为"连贯的、条理清晰的"（如 a coherent argument 有条理的论证），对应 logically consistent。',
  },
  {
    id: 't011',
    type: 'vocab',
    prompt: 'The word "deficient" is closest in meaning to which of the following?',
    options: ['Sufficient', 'Lacking', 'Accurate', 'Flexible'],
    answerIndex: 1,
    explanation:
      'deficient 意为"缺乏的、不足的"（如 deficient in vitamin D 缺乏维生素D），对应 lacking。sufficient（充足的）是其反义词。',
  },
  {
    id: 't012',
    type: 'vocab',
    prompt: 'The word "deteriorate" is closest in meaning to which of the following?',
    options: ['Improve', 'Worsen', 'Stabilize', 'Recover'],
    answerIndex: 1,
    explanation:
      'deteriorate 意为"恶化、变坏"（如 His health deteriorated 他的健康恶化了），对应 worsen。improve 是其反义词。',
  },
  {
    id: 't013',
    type: 'vocab',
    prompt: 'The word "prolific" is closest in meaning to which of the following?',
    options: ['Highly productive', 'Highly predictable', 'Completely silent', 'Rarely seen'],
    answerIndex: 0,
    explanation:
      'prolific 意为"多产的、成果丰富的"（如 a prolific writer 多产作家），对应 highly productive。',
  },
  {
    id: 't014',
    type: 'vocab',
    prompt: 'The word "substantiate" is closest in meaning to which of the following?',
    options: ['Deny', 'Prove', 'Question', 'Simplify'],
    answerIndex: 1,
    explanation:
      'substantiate 意为"证实、证明"（如 substantiate a claim 证实一种说法），对应 prove。',
  },
  {
    id: 't015',
    type: 'vocab',
    prompt: 'The word "concur" is closest in meaning to which of the following?',
    options: ['Disagree', 'Agree', 'Protest', 'Compete'],
    answerIndex: 1,
    explanation:
      'concur 意为"同意、一致"（如 I concur with your opinion 我同意你的看法），对应 agree。disagree 是其反义词。',
  },

  // ---------- 语法（15 题） ----------
  {
    id: 't016',
    type: 'grammar',
    prompt: 'Neither the teacher nor the students ___ satisfied with the result.',
    options: ['was', 'were', 'is', 'has'],
    answerIndex: 1,
    explanation:
      'Neither...nor... 结构中，谓语动词与就近的主语一致。这里最近的主语是 the students（复数），所以用 were。',
  },
  {
    id: 't017',
    type: 'grammar',
    prompt: 'She is one of the students who ___ praised by the principal.',
    options: ['was', 'were', 'is', 'has been'],
    answerIndex: 1,
    explanation:
      '先行词是 the students（复数），定语从句 who ___ praised 修饰复数名词，因此谓语用 were。',
  },
  {
    id: 't018',
    type: 'grammar',
    prompt: 'The report ___ to the manager before the meeting ended.',
    options: ['submitted', 'was submitting', 'had been submitted', 'has submitted'],
    answerIndex: 2,
    explanation:
      "before the meeting ended 表示过去某个时间点之前完成的动作，应用过去完成时；report 是被提交，用被动语态 had been submitted。",
  },
  {
    id: 't019',
    type: 'grammar',
    prompt: 'If I ___ you, I would accept the offer immediately.',
    options: ['am', 'was', 'were', 'be'],
    answerIndex: 2,
    explanation:
      '与现在事实相反的虚拟条件句中，be 动词一律用 were（包括第一、三人称单数），这是虚拟语气的固定用法。',
  },
  {
    id: 't020',
    type: 'grammar',
    prompt: 'The equipment, along with the manuals, ___ been shipped to the site.',
    options: ['have', 'has', 'were', 'are'],
    answerIndex: 1,
    explanation:
      '主语是 the equipment（不可数），along with the manuals 只是插入语，不影响主谓一致，所以用 has。',
  },
  {
    id: 't021',
    type: 'grammar',
    prompt: 'Not until he arrived ___ the meeting start.',
    options: ['did', 'was', 'had', 'does'],
    answerIndex: 0,
    explanation:
      'Not until 置于句首时，主句需要部分倒装；arrived 是过去时，用助动词 did + 动词原形 start，即 did the meeting start。',
  },
  {
    id: 't022',
    type: 'grammar',
    prompt: 'It is essential that every employee ___ the safety regulations.',
    options: ['follows', 'follow', 'will follow', 'followed'],
    answerIndex: 1,
    explanation:
      "It is essential that... 后的从句用虚拟语气，谓语为动词原形（省略 should），即 every employee follow。",
  },
  {
    id: 't023',
    type: 'grammar',
    prompt: 'The number of applicants ___ increased sharply this year.',
    options: ['have', 'has', 'are', 'were'],
    answerIndex: 1,
    explanation:
      'the number of + 复数名词作主语时，中心词是 number（单数），谓语用单数 has。注意 a number of 才用复数谓语。',
  },
  {
    id: 't024',
    type: 'grammar',
    prompt: 'Hardly had he left the office ___ it began to rain.',
    options: ['than', 'when', 'then', 'while'],
    answerIndex: 1,
    explanation:
      'hardly...when... 是固定搭配，意为"刚……就……"。Hardly had he left... when it began to rain（他刚离开就开始下雨了）。',
  },
  {
    id: 't025',
    type: 'grammar',
    prompt: 'She suggested that the meeting ___ postponed until next week.',
    options: ['was', 'is', 'be', 'would be'],
    answerIndex: 2,
    explanation:
      'suggest 后接 that 从句时用虚拟语气，谓语为动词原形（should be postponed 省略 should 为 be postponed）。',
  },
  {
    id: 't026',
    type: 'grammar',
    prompt: 'This is the house ___ I was born.',
    options: ['which', 'in which', 'where in', 'that'],
    answerIndex: 1,
    explanation:
      '先行词 the house 在定语从句中作地点状语（in the house），关系词用 in which 或 where。这里选项只有 in which 正确。',
  },
  {
    id: 't027',
    type: 'grammar',
    prompt: 'The more you practice, ___ you will become.',
    options: ['more fluent', 'the more fluent', 'fluent', 'the fluenter'],
    answerIndex: 1,
    explanation:
      '"the + 比较级..., the + 比较级..." 表示"越……就越……"。more...you become 应用 the more fluent（更多音节形容词用 more，不用 fluenter）。',
  },
  {
    id: 't028',
    type: 'grammar',
    prompt: 'Despite ___ late, he still finished the report on time.',
    options: ['to arrive', 'arriving', 'arrive', 'arrived'],
    answerIndex: 1,
    explanation:
      'despite 是介词，后接名词或动名词。despite arriving late 意为"尽管来晚了"。',
  },
  {
    id: 't029',
    type: 'grammar',
    prompt: 'The manager, as well as his assistants, ___ at the meeting yesterday.',
    options: ['were', 'was', 'have been', 'are'],
    answerIndex: 1,
    explanation:
      '主语是 the manager（单数），as well as his assistants 是插入成分，不影响主谓一致；yesterday 用过去时，所以用 was。',
  },
  {
    id: 't030',
    type: 'grammar',
    prompt: 'Only after the experiment ___ were the scientists able to draw a conclusion.',
    options: ['has completed', 'had been completed', 'was completing', 'is completed'],
    answerIndex: 1,
    explanation:
      'experiment 是被完成，主句用过去时 were able to，从句用过去完成时被动 had been completed。Only 置句首主句倒装。',
  },

  // ---------- 句子填空（10 题） ----------
  {
    id: 't031',
    type: 'sentence',
    prompt: 'The discovery was completely ___, as no one had expected such a result.',
    options: ['surprising', 'surprised', 'surprise', 'surprisingly'],
    answerIndex: 0,
    explanation:
      '系动词 was 后接形容词作表语，描述 discovery 本身令人惊讶，用 surprising（令人惊讶的）。surprised 表示人的感受，surprisingly 是副词。',
  },
  {
    id: 't032',
    type: 'sentence',
    prompt: 'Because the instructions were ___, many users found the device difficult to operate.',
    options: ['ambiguous', 'precise', 'obvious', 'reliable'],
    answerIndex: 0,
    explanation:
      '由"用户难以操作"推断说明书含糊不清，填 ambiguous（模棱两可的）。precise（精确的）、obvious（明显的）逻辑相反。',
  },
  {
    id: 't033',
    type: 'sentence',
    prompt: "The company's profits have ___ steadily over the past decade.",
    options: ['risen', 'raised', 'arisen', 'rised'],
    answerIndex: 0,
    explanation:
      'profits 作主语时用不及物动词 rise（上升），过去分词为 risen。raise 是及物动词（raise profits 提高利润），arise（出现）语义不符，rised 是错误形式。',
  },
  {
    id: 't034',
    type: 'sentence',
    prompt: 'Although the two theories differ in detail, they ___ on the central issue.',
    options: ['diverge', 'converge', 'disagree', 'clash'],
    answerIndex: 1,
    explanation:
      'although 表转折："虽然在细节上不同，但在核心问题上一致"。converge on 意为"在……上趋于一致"。diverge/disagree/clash 都与"一致"相反。',
  },
  {
    id: 't035',
    type: 'sentence',
    prompt: 'The new policy was designed to ___ the gap between the rich and the poor.',
    options: ['widen', 'narrow', 'maintain', 'measure'],
    answerIndex: 1,
    explanation:
      '政策设计的目的通常是缩小贫富差距，narrow the gap（缩小差距）是常用搭配。widen（扩大）语义相反。',
  },
  {
    id: 't036',
    type: 'sentence',
    prompt: 'Scientists remain ___ about the long-term effects of the drug.',
    options: ['skeptical', 'certain', 'confident', 'optimistic'],
    answerIndex: 0,
    explanation:
      'remain skeptical about 意为"对……持怀疑态度"，符合科学家对长期影响谨慎表述的语境。certain/confident/optimistic 都表示肯定。',
  },
  {
    id: 't037',
    type: 'sentence',
    prompt: 'The lecture was so ___ that most of the audience fell asleep.',
    options: ['fascinating', 'tedious', 'lively', 'inspiring'],
    answerIndex: 1,
    explanation:
      '由"大部分听众睡着了"推断讲座枯燥乏味，填 tedious（冗长乏味的）。fascinating（迷人的）、lively（生动的）、inspiring（鼓舞人心的）都与之相反。',
  },
  {
    id: 't038',
    type: 'sentence',
    prompt: 'She showed remarkable ___ in dealing with the unexpected crisis.',
    options: ['composure', 'confusion', 'anxiety', 'haste'],
    answerIndex: 0,
    explanation:
      'show composure 意为"表现出镇定"，与"应对突发危机"的语境吻合。confusion（慌乱）、anxiety（焦虑）语义相反，haste（匆忙）不贴切。',
  },
  {
    id: 't039',
    type: 'sentence',
    prompt: 'The results of the two independent experiments were ___ consistent.',
    options: ['remarkably', 'rarely', 'hardly', 'scarcely'],
    answerIndex: 0,
    explanation:
      '描述两次独立实验的结果高度一致，用 remarkably（非常地）。rarely/hardly/scarcely 都含否定含义，与 consistent 搭配矛盾。',
  },
  {
    id: 't040',
    type: 'sentence',
    prompt: 'His argument was highly ___, based on careful analysis of the data.',
    options: ['persuasive', 'arbitrary', 'vague', 'fragile'],
    answerIndex: 0,
    explanation:
      '基于对数据的仔细分析，论证应当有说服力，填 persuasive（有说服力的）。arbitrary（武断的）、vague（含糊的）、fragile（脆弱的）都否定其说服力。',
  },

  // ---------- 短阅读（10 题） ----------
  {
    id: 't041',
    type: 'reading',
    passage:
      'Geothermal energy, which comes from heat stored beneath the Earth\'s surface, is considered a renewable resource. Unlike solar and wind power, it is not dependent on weather conditions and can provide a steady supply of electricity around the clock. However, its development is limited to regions where the geological conditions are suitable, such as areas with volcanic activity or hot springs.',
    prompt: 'According to the passage, what is one advantage of geothermal energy over solar and wind power?',
    options: [
      'It is cheaper to install.',
      'It is not affected by weather conditions.',
      'It produces more electricity.',
      'It can be used in any region.',
    ],
    answerIndex: 1,
    explanation:
      '原文明确指出"Unlike solar and wind power, it is not dependent on weather conditions"，即地热能不受天气影响，可全天候稳定供电。而"可适用于任何地区"与文末限制条件矛盾。',
  },
  {
    id: 't042',
    type: 'reading',
    passage:
      'The invention of the printing press in the fifteenth century transformed European society. Before its arrival, books were copied by hand and were so expensive that only the wealthy could own them. The new technology dramatically reduced the cost of books, making written knowledge accessible to a much broader population and accelerating the spread of new ideas.',
    prompt: 'What can be inferred about books before the printing press?',
    options: [
      'They were widely available to the public.',
      'They were produced by hand and very costly.',
      'They contained only religious content.',
      'They were printed in large quantities.',
    ],
    answerIndex: 1,
    explanation:
      '原文说印刷术出现前书籍"were copied by hand and were so expensive that only the wealthy could own them"，因此可推断此前书籍手工抄写、价格高昂。',
  },
  {
    id: 't043',
    type: 'reading',
    passage:
      'Camouflage is a survival strategy used by many animals. Some species change color to blend into their surroundings, while others mimic the appearance of dangerous creatures to deter predators. A third group relies on patterns that break up their body outline, making them difficult to detect against complex backgrounds such as forests or coral reefs.',
    prompt: 'According to the passage, how do some animals protect themselves by mimicry?',
    options: [
      'By changing color rapidly.',
      'By imitating the appearance of dangerous creatures.',
      'By hiding in dark caves.',
      'By forming large groups.',
    ],
    answerIndex: 1,
    explanation:
      '原文提到"others mimic the appearance of dangerous creatures to deter predators"，即通过模仿危险生物的外表来吓退捕食者，这正是 mimicry（拟态）的定义。',
  },
  {
    id: 't044',
    type: 'reading',
    passage:
      'Urban heat islands occur when cities replace natural land cover with buildings and roads. These surfaces absorb and retain more heat than vegetation does, causing urban areas to be several degrees warmer than surrounding rural regions. The effect is strongest at night, when stored heat is slowly released. Planting trees and using reflective materials on rooftops can help reduce this phenomenon.',
    prompt: 'Why are urban areas often warmer than rural areas?',
    options: [
      'They receive more sunlight.',
      'Buildings and roads absorb and retain more heat than vegetation.',
      'They are located in warmer climates.',
      'They have more people living there.',
    ],
    answerIndex: 1,
    explanation:
      '原文核心原因是"These surfaces absorb and retain more heat than vegetation does"，即建筑和道路比植被吸收并保留更多热量，导致城市更热。',
  },
  {
    id: 't045',
    type: 'reading',
    passage:
      'Beekeeping has a history of thousands of years. Early humans collected honey from wild nests, but eventually learned to keep bees in simple hives. Modern beekeeping not only produces honey but also plays a vital role in agriculture, since bees pollinate many of the crops that feed the human population. In recent decades, however, bee populations have declined sharply, partly because of pesticide use and habitat loss.',
    prompt: 'According to the passage, why are bees important to agriculture?',
    options: [
      'They produce honey for farmers.',
      'They pollinate many crops.',
      'They control pests naturally.',
      'They improve soil quality.',
    ],
    answerIndex: 1,
    explanation:
      '原文指出"bees pollinate many of the crops that feed the human population"，蜜蜂为大量农作物授粉，因此对农业至关重要。',
  },
  {
    id: 't046',
    type: 'reading',
    passage:
      'The idea that the continents were once joined together was proposed by Alfred Wegener in 1912. He noticed that the coastlines of Africa and South America seemed to fit together like pieces of a puzzle, and that similar fossils appeared on both continents. Although his theory of continental drift was initially rejected by many scientists, it was later confirmed by evidence from the seafloor and eventually developed into the modern theory of plate tectonics.',
    prompt: 'Why was Wegener\'s theory initially rejected?',
    options: [
      'The fossils were proven to be fake.',
      'Scientists later confirmed it with seafloor evidence.',
      'His evidence was limited at the time.',
      'The theory contradicted fossil records.',
    ],
    answerIndex: 2,
    explanation:
      '原文并未明说被拒原因，但根据文意：他最初只依据海岸线吻合和化石分布（有限证据）提出设想，被许多科学家拒绝；后由海床证据证实。注意题干问"最初被拒的原因"，只有"证据当时有限"是合理的推断。',
  },
  {
    id: 't047',
    type: 'reading',
    passage:
      'Sea otters play a key role in maintaining the health of kelp forests. They feed on sea urchins, which would otherwise overgraze the kelp and destroy the underwater habitat. When otter populations declined in the past, kelp forests shrank dramatically. Their recovery has been followed by the return of dense kelp, demonstrating how the presence of a single predator can shape an entire ecosystem.',
    prompt: 'What happens to kelp forests when sea otter populations decline?',
    options: [
      'They expand rapidly.',
      'They shrink dramatically.',
      'They become denser.',
      'They move to deeper water.',
    ],
    answerIndex: 1,
    explanation:
      '原文明确说明"当海獭数量下降时，海藻林显著萎缩"（kelp forests shrank dramatically），因为海胆过度啃食海藻。',
  },
  {
    id: 't048',
    type: 'reading',
    passage:
      'The construction of the transcontinental railroad in the United States was completed in 1869. It connected the eastern and western coasts, dramatically reducing the time needed to travel across the country and enabling the rapid settlement of western territories. The project also created thousands of jobs, though it depended heavily on the labor of immigrant workers who often faced difficult and dangerous conditions.',
    prompt: 'According to the passage, what was one result of the transcontinental railroad?',
    options: [
      'It increased travel time across the country.',
      'It made western settlement much faster.',
      'It eliminated the need for immigrant labor.',
      'It connected the coasts by sea route.',
    ],
    answerIndex: 1,
    explanation:
      '原文指出铁路"enabling the rapid settlement of western territories"，即大幅加快了西部领土的定居进程。其余选项与原文相反或无关。',
  },
  {
    id: 't049',
    type: 'reading',
    passage:
      'Scientists studying animal behavior distinguish between innate behaviors, which are present from birth and do not need to be learned, and learned behaviors, which develop through experience. A spider spinning its first web demonstrates an innate behavior, whereas a young bird perfecting its song by listening to adults shows learned behavior. Many species rely on a combination of both types to survive.',
    prompt: 'Which of the following is an example of an innate behavior?',
    options: [
      'A young bird learning a song from adults.',
      'A spider spinning its first web.',
      'A dog responding to training.',
      'A child learning to read.',
    ],
    answerIndex: 1,
    explanation:
      '原文以"蜘蛛织出第一张网"为例说明先天行为（innate behavior）：天生具备、无需学习。其余选项都是通过学习获得的习得行为。',
  },
  {
    id: 't050',
    type: 'reading',
    passage:
      'Coral reefs are among the most diverse ecosystems on Earth, supporting a vast array of marine life. They are built by tiny animals called coral polyps, which secrete calcium carbonate to form hard skeletons. Reefs grow slowly, often only a few centimeters per year, and are highly sensitive to changes in water temperature. Even a small rise in temperature can cause corals to expel the algae living in their tissues, leading to bleaching and, if prolonged, death.',
    prompt: 'What causes coral bleaching according to the passage?',
    options: [
      'A rise in water temperature.',
      'A lack of sunlight.',
      'Overgrowth of marine plants.',
      'The death of coral polyps.',
    ],
    answerIndex: 0,
    explanation:
      '原文说明水温哪怕小幅升高也会使珊瑚排出组织内的藻类，导致白化（bleaching）。白化是排出藻类的直接后果，而非珊瑚死亡本身。',
  },
]
