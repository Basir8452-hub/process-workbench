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

  // ---------- 词汇补充（15 题，t046-t060） ----------
  {
    id: 't051',
    type: 'vocab',
    prompt: 'The word "diligent" is closest in meaning to which of the following?',
    options: ['Lazy', 'Hardworking', 'Clever', 'Careless'],
    answerIndex: 1,
    explanation:
      'diligent 意为"勤奋的、刻苦的"（如 a diligent student 勤奋的学生），对应 hardworking。lazy（懒惰的）是其反义词。',
  },
  {
    id: 't052',
    type: 'vocab',
    prompt: 'The word "reluctant" is closest in meaning to which of the following?',
    options: ['Eager', 'Unwilling', 'Unable', 'Unaware'],
    answerIndex: 1,
    explanation:
      'reluctant 意为"不情愿的、勉强的"（如 reluctant to leave 不愿离开），对应 unwilling。eager（渴望的）是其反义词。',
  },
  {
    id: 't053',
    type: 'vocab',
    prompt: 'The word "authentic" is closest in meaning to which of the following?',
    options: ['Artificial', 'Genuine', 'Ancient', 'Popular'],
    answerIndex: 1,
    explanation:
      'authentic 意为"真实的、正宗的"（如 authentic Chinese food 正宗中餐），对应 genuine。artificial（人造的）是其反义词。',
  },
  {
    id: 't054',
    type: 'vocab',
    prompt: 'The word "inevitable" is closest in meaning to which of the following?',
    options: ['Avoidable', 'Unavoidable', 'Unusual', 'Impossible'],
    answerIndex: 1,
    explanation:
      'inevitable 意为"不可避免的"（如 inevitable consequence 不可避免的后果），对应 unavoidable。avoidable 是其反义词。',
  },
  {
    id: 't055',
    type: 'vocab',
    prompt: 'The word "compensate" is closest in meaning to which of the following?',
    options: ['Punish', 'Make up for', 'Criticize', 'Ignore'],
    answerIndex: 1,
    explanation:
      'compensate 意为"补偿、弥补"（如 compensate for the loss 弥补损失），对应 make up for。punish（惩罚）语义不符。',
  },
  {
    id: 't056',
    type: 'vocab',
    prompt: 'The word "distinct" is closest in meaning to which of the following?',
    options: ['Vague', 'Clearly different', 'Similar', 'Hidden'],
    answerIndex: 1,
    explanation:
      'distinct 意为"明显不同的、清晰的"（如 distinct species 不同的物种），对应 clearly different。vague（模糊的）是其反义词。',
  },
  {
    id: 't057',
    type: 'vocab',
    prompt: 'The word "controversial" is closest in meaning to which of the following?',
    options: ['Agreed upon', 'Debated', 'Settled', 'Ignored'],
    answerIndex: 1,
    explanation:
      'controversial 意为"有争议的"（如 a controversial decision 有争议的决定），对应 debated（被争论的）。agreed upon（一致的）语义相反。',
  },
  {
    id: 't058',
    type: 'vocab',
    prompt: 'The word "comprehensive" is closest in meaning to which of the following?',
    options: ['Partial', 'Complete', 'Brief', 'Simple'],
    answerIndex: 1,
    explanation:
      'comprehensive 意为"全面的、综合的"（如 comprehensive report 全面的报告），对应 complete。partial（部分的）是其反义词。',
  },
  {
    id: 't059',
    type: 'vocab',
    prompt: 'The word "deter" is closest in meaning to which of the following?',
    options: ['Encourage', 'Discourage', 'Assist', 'Accelerate'],
    answerIndex: 1,
    explanation:
      'deter 意为"阻止、威慑"（如 deter crime 遏制犯罪），对应 discourage（使打消念头）。encourage（鼓励）是其反义词。',
  },
  {
    id: 't060',
    type: 'vocab',
    prompt: 'The word "significant" is closest in meaning to which of the following?',
    options: ['Trivial', 'Important', 'Obvious', 'Rare'],
    answerIndex: 1,
    explanation:
      'significant 意为"重要的、显著的"（如 significant progress 显著进展），对应 important。trivial（琐碎的）是其反义词。',
  },
  {
    id: 't061',
    type: 'vocab',
    prompt: 'The word "subsequent" is closest in meaning to which of the following?',
    options: ['Previous', 'Following', 'Concurrent', 'Final'],
    answerIndex: 1,
    explanation:
      'subsequent 意为"随后的、后来的"（如 subsequent events 后续事件），对应 following。previous（先前的）是其反义词。',
  },
  {
    id: 't062',
    type: 'vocab',
    prompt: 'The word "redundant" is closest in meaning to which of the following?',
    options: ['Essential', 'Unnecessary', 'Complex', 'Modern'],
    answerIndex: 1,
    explanation:
      'redundant 意为"多余的、冗余的"（如 redundant information 冗余信息），对应 unnecessary。essential（必要的）是其反义词。',
  },
  {
    id: 't063',
    type: 'vocab',
    prompt: 'The word "prevail" is closest in meaning to which of the following?',
    options: ['Fail', 'Triumph', 'Retreat', 'Hesitate'],
    answerIndex: 1,
    explanation:
      'prevail 意为"获胜、盛行"（如 prevail over difficulties 战胜困难），对应 triumph（获胜）。fail（失败）是其反义词。',
  },
  {
    id: 't064',
    type: 'vocab',
    prompt: 'The word "transparent" is closest in meaning to which of the following?',
    options: ['Opaque', 'Open and clear', 'Complex', 'Delicate'],
    answerIndex: 1,
    explanation:
      'transparent 意为"透明的、公开清晰的"（如 transparent process 透明的流程），对应 open and clear。opaque（不透明的）是其反义词。',
  },
  {
    id: 't065',
    type: 'vocab',
    prompt: 'The word "versatile" is closest in meaning to which of the following?',
    options: ['Single-purpose', 'Adaptable', 'Fragile', 'Outdated'],
    answerIndex: 1,
    explanation:
      'versatile 意为"多才多艺的、多用途的"（如 a versatile tool 多用途工具），对应 adaptable（适应性强的）。single-purpose（单一用途的）语义相反。',
  },

  // ---------- 语法补充（15 题，t061-t075） ----------
  {
    id: 't066',
    type: 'grammar',
    prompt: 'By the time the fire brigade arrived, the building ___ to the ground.',
    options: ['burned', 'had burned', 'was burning', 'has burned'],
    answerIndex: 1,
    explanation:
      'by the time + 过去时主句，表示"在……之前已经……"，从句用过去完成时 had burned（已经烧毁）。',
  },
  {
    id: 't067',
    type: 'grammar',
    prompt: 'The book ___ into twelve languages so far.',
    options: ['translated', 'has been translated', 'is translating', 'was translated'],
    answerIndex: 1,
    explanation:
      'so far 与现在完成时连用；书被翻译成多种语言，用被动语态 has been translated。',
  },
  {
    id: 't068',
    type: 'grammar',
    prompt: '___ his help, we would not have finished the project on time.',
    options: ['But for', 'Despite', 'Because of', 'Thanks to'],
    answerIndex: 0,
    explanation:
      'but for 意为"要不是"，引导虚拟语气条件。句意"要不是他的帮助，我们就无法按时完成项目"，与 would not have finished 的虚拟语气吻合。',
  },
  {
    id: 't069',
    type: 'grammar',
    prompt: 'The number of errors in the report ___ surprisingly small.',
    options: ['are', 'is', 'were', 'have been'],
    answerIndex: 1,
    explanation:
      'the number of + 复数名词作主语，中心词是 number（单数），谓语用单数 is。',
  },
  {
    id: 't070',
    type: 'grammar',
    prompt: 'I would rather you ___ the report before the meeting.',
    options: ['finish', 'finished', 'will finish', 'have finished'],
    answerIndex: 1,
    explanation:
      "would rather + 从句时，从句用一般过去时表示虚拟（与现在/将来事实相反），即 would rather you finished。",
  },
  {
    id: 't071',
    type: 'grammar',
    prompt: 'The factory ___ produces batteries was built ten years ago.',
    options: ['where', 'which', 'what', 'who'],
    answerIndex: 1,
    explanation:
      '先行词 the factory 在定语从句中作主语（the factory produces batteries），关系代词用 which。where 只能作地点状语。',
  },
  {
    id: 't072',
    type: 'grammar',
    prompt: '___ from the hill, the city looks like a giant garden.',
    options: ['Seeing', 'Seen', 'To see', 'Having seen'],
    answerIndex: 1,
    explanation:
      '主语 the city 与 see 之间是被动关系（城市被看），用过去分词 Seen from the hill，意为"从山上看，城市像一座大花园"。',
  },
  {
    id: 't073',
    type: 'grammar',
    prompt: 'It was not until midnight ___ the meeting came to an end.',
    options: ['that', 'when', 'which', 'where'],
    answerIndex: 0,
    explanation:
      'It was not until...that... 是强调句型，意为"直到午夜会议才结束"。强调 not until 结构时用 that。',
  },
  {
    id: 't074',
    type: 'grammar',
    prompt: 'He suggested ___ a trip to the factory next week.',
    options: ['to make', 'making', 'make', 'made'],
    answerIndex: 1,
    explanation:
      'suggest doing sth 是固定搭配，意为"建议做某事"。suggest 后接动名词，不接不定式。',
  },
  {
    id: 't075',
    type: 'grammar',
    prompt: 'The problem ___ at the next meeting will be discussed in detail.',
    options: ['raising', 'raised', 'to raise', 'raise'],
    answerIndex: 1,
    explanation:
      'the problem raised at the next meeting 中，raise 与 problem 是被动关系，用过去分词 raised 作后置定语，意为"将在下次会议上提出的问题"。',
  },
  {
    id: 't076',
    type: 'grammar',
    prompt: 'Only when he returned ___ the truth.',
    options: ['he knew', 'did he know', 'he knows', 'has he known'],
    answerIndex: 1,
    explanation:
      'Only + 状语从句置于句首时，主句部分倒装。returned 是过去时，用 did he know。',
  },
  {
    id: 't077',
    type: 'grammar',
    prompt: 'The experiment, ___ took two years, finally proved the theory.',
    options: ['that', 'which', 'who', 'when'],
    answerIndex: 1,
    explanation:
      '非限制性定语从句不能用 that，先行词 the experiment 指物，用 which。which took two years 补充说明实验持续了两年。',
  },
  {
    id: 't078',
    type: 'grammar',
    prompt: 'Not only ___ the machine, but he also repaired it.',
    options: ['he operated', 'did he operate', 'he operates', 'does he operate'],
    answerIndex: 1,
    explanation:
      'Not only 置于句首时，前半句部分倒装。repaired 是过去时，用 did he operate。',
  },
  {
    id: 't079',
    type: 'grammar',
    prompt: 'It is high time that we ___ measures to protect the environment.',
    options: ['take', 'took', 'will take', 'have taken'],
    answerIndex: 1,
    explanation:
      'It is high time that... 句型中，从句用一般过去时表示虚拟，意为"是时候……了"。',
  },
  {
    id: 't080',
    type: 'grammar',
    prompt: 'The reason why he failed is ___ he did not follow the instructions.',
    options: ['because', 'that', 'why', 'for'],
    answerIndex: 1,
    explanation:
      'The reason is that... 是固定句型，表语从句用 that 引导，不用 because（避免 because 与 reason 语义重复）。',
  },

  // ---------- 句子填空补充（20 题，t076-t095） ----------
  {
    id: 't081',
    type: 'sentence',
    prompt: 'The manager praised the team for their ___ dedication to the project.',
    options: ['unwavering', 'wavering', 'casual', 'reluctant'],
    answerIndex: 0,
    explanation:
      'praise（表扬）的原因应是"坚定不移的投入"，unwavering dedication 意为"坚定不移的奉献"。wavering（动摇的）与之相反。',
  },
  {
    id: 't082',
    type: 'sentence',
    prompt: 'The new equipment must be ___ tested before it is put into production.',
    options: ['thoroughly', 'hastily', 'superficially', 'partially'],
    answerIndex: 0,
    explanation:
      '投产前新设备必须"彻底"测试，thoroughly tested（彻底测试）。hastily（草率地）、superficially（表面地）都与安全生产要求矛盾。',
  },
  {
    id: 't083',
    type: 'sentence',
    prompt: 'The two departments have ___ worked together on previous projects.',
    options: ['collaborated', 'competed', 'conflicted', 'clashed'],
    answerIndex: 0,
    explanation:
      'worked together 即"协作"，collaborate（合作）与其同义。compete（竞争）、conflict（冲突）都与"一起工作"矛盾。',
  },
  {
    id: 't084',
    type: 'sentence',
    prompt: 'The report provides a detailed ___ of the manufacturing process.',
    options: ['overview', 'glimpse', 'rumor', 'hint'],
    answerIndex: 0,
    explanation:
      'a detailed overview 意为"详细的概述"，符合"报告的详细描述"语境。glimpse（一瞥）、rumor（谣言）、hint（暗示）都不搭配 detailed。',
  },
  {
    id: 't085',
    type: 'sentence',
    prompt: 'The technician identified the ___ cause of the equipment failure.',
    options: ['root', 'surface', 'minor', 'random'],
    answerIndex: 0,
    explanation:
      'root cause 是固定搭配，意为"根本原因"。surface cause（表面原因）、minor cause（次要原因）都不符合"识别原因"的专业表达。',
  },
  {
    id: 't086',
    type: 'sentence',
    prompt: 'The quality of the products has ___ improved since the new process was introduced.',
    options: ['dramatically', 'marginally', 'slowly', 'hardly'],
    answerIndex: 0,
    explanation:
      'dramatically improved 意为"显著改善"，强调新工艺带来的明显效果。marginally（轻微地）、hardly（几乎不）与"新工艺引入"的积极语境不符。',
  },
  {
    id: 't087',
    type: 'sentence',
    prompt: 'The assembly line was ___ due to a shortage of raw materials.',
    options: ['halted', 'accelerated', 'expanded', 'modernized'],
    answerIndex: 0,
    explanation:
      '原材料短缺导致生产线"暂停"，halted（停止）。accelerated（加速）、expanded（扩展）都与短缺语境矛盾。',
  },
  {
    id: 't088',
    type: 'sentence',
    prompt: 'The engineer proposed a ___ solution to reduce energy consumption.',
    options: ['feasible', 'imaginary', 'impractical', 'theoretical'],
    answerIndex: 0,
    explanation:
      '提出一个"可行的"解决方案来降低能耗，feasible（可行的）。imaginary（虚构的）、impractical（不切实际的）都不是真正的解决方案。',
  },
  {
    id: 't089',
    type: 'sentence',
    prompt: 'It is important to ___ the safety regulations at all times.',
    options: ['comply with', 'rely on', 'depart from', 'object to'],
    answerIndex: 0,
    explanation:
      'comply with the regulations 意为"遵守规定"，是固定搭配。depart from（背离）、object to（反对）都与安全要求矛盾。',
  },
  {
    id: 't090',
    type: 'sentence',
    prompt: 'The team needs to ___ the problem before it escalates.',
    options: ['address', 'ignore', 'postpone', 'avoid'],
    answerIndex: 0,
    explanation:
      'address the problem 意为"处理问题"，符合"在问题升级前解决"的语境。ignore（忽视）、postpone（推迟）都会导致问题恶化。',
  },
  {
    id: 't091',
    type: 'sentence',
    prompt: 'The factory was ___ to strict environmental standards.',
    options: ['subject', 'opposed', 'immune', 'indifferent'],
    answerIndex: 0,
    explanation:
      'be subject to 意为"受制于、须遵守"，工厂须遵守严格的环保标准。opposed to（反对）、immune to（对……免疫）语义不符。',
  },
  {
    id: 't092',
    type: 'sentence',
    prompt: 'The new battery technology is ___ to the electric vehicle industry.',
    options: ['crucial', 'irrelevant', 'detrimental', 'harmless'],
    answerIndex: 0,
    explanation:
      'crucial to 意为"对……至关重要"，新电池技术对电动车行业至关重要。irrelevant（无关的）语义相反。',
  },
  {
    id: 't093',
    type: 'sentence',
    prompt: 'The company decided to ___ its production capacity to meet growing demand.',
    options: ['expand', 'reduce', 'maintain', 'freeze'],
    answerIndex: 0,
    explanation:
      '为满足增长的需求，公司决定"扩大"产能，expand（扩大）。reduce（减少）、freeze（冻结）都与增长需求矛盾。',
  },
  {
    id: 't094',
    type: 'sentence',
    prompt: 'The workers were ___ for their excellent performance in the safety drill.',
    options: ['commended', 'criticized', 'reprimanded', 'warned'],
    answerIndex: 0,
    explanation:
      '因在安全演习中的出色表现而"受到表扬"，commended（表扬）。criticized（批评）、reprimanded（训斥）、warned（警告）都与 excellent performance 矛盾。',
  },
  {
    id: 't095',
    type: 'sentence',
    prompt: 'The equipment must be operated ___ to prevent accidents.',
    options: ['properly', 'carelessly', 'randomly', 'hastily'],
    answerIndex: 0,
    explanation:
      '为防止事故，设备必须"正确地"操作，properly（正确地）。carelessly（粗心地）、randomly（随意地）都会导致事故。',
  },
  {
    id: 't096',
    type: 'sentence',
    prompt: 'The technician checked the machine ___ for any signs of wear.',
    options: ['regularly', 'occasionally', 'rarely', 'never'],
    answerIndex: 0,
    explanation:
      'regularly（定期地）检查机器磨损情况，符合设备维护的规范做法。occasionally（偶尔）、rarely（很少）都不足以保障设备安全。',
  },
  {
    id: 't097',
    type: 'sentence',
    prompt: 'The new process is expected to ___ production efficiency by 20 percent.',
    options: ['boost', 'reduce', 'maintain', 'limit'],
    answerIndex: 0,
    explanation:
      'boost production efficiency 意为"提高生产效率"，新工艺预期提高效率 20%。reduce（降低）、limit（限制）语义相反。',
  },
  {
    id: 't098',
    type: 'sentence',
    prompt: 'The safety training was ___ for all new employees.',
    options: ['mandatory', 'optional', 'voluntary', 'irrelevant'],
    answerIndex: 0,
    explanation:
      '安全培训对全体新员工是"强制性的"，mandatory（强制的）。optional/voluntary（可选的）不符合安全管理的严格要求。',
  },
  {
    id: 't099',
    type: 'sentence',
    prompt: 'The engineer will ___ the equipment failure to determine the root cause.',
    options: ['investigate', 'ignore', 'conceal', 'overlook'],
    answerIndex: 0,
    explanation:
      'investigate（调查）设备故障以确定根本原因，符合问题闭环流程。ignore（忽视）、conceal（隐瞒）都是错误做法。',
  },
  {
    id: 't100',
    type: 'sentence',
    prompt: 'The quality control team ___ every batch of products before shipment.',
    options: ['inspects', 'ignores', 'skips', 'assumes'],
    answerIndex: 0,
    explanation:
      '质检团队在发货前"检验"每一批产品，inspects（检验）。ignores/skips（跳过）会导致不合格产品流出。',
  },

  // ---------- 短阅读补充（20 题，t096-t115） ----------
  {
    id: 't101',
    type: 'reading',
    passage:
      'The Industrial Revolution, which began in Britain in the eighteenth century, brought about fundamental changes in manufacturing. Factories replaced small workshops, and machines took over tasks that had previously been done by hand. While the new system greatly increased productivity, it also created challenging working conditions for many laborers, including long hours and low wages.',
    prompt: 'According to the passage, what was one negative consequence of the Industrial Revolution?',
    options: [
      'Machines were unreliable.',
      'Working conditions became difficult.',
      'Productivity decreased.',
      'Factories closed down.',
    ],
    answerIndex: 1,
    explanation:
      '文中明确提到"it also created challenging working conditions for many laborers, including long hours and low wages"，即劳动条件变得艰苦。而生产率是提高而非下降。',
  },
  {
    id: 't102',
    type: 'reading',
    passage:
      'Batteries store chemical energy and convert it into electrical energy when needed. Lithium-ion batteries, which are widely used in electric vehicles, offer a high energy density and can be recharged hundreds of times. However, their performance gradually declines with use, and they must be handled carefully to avoid overheating.',
    prompt: 'What is mentioned as a limitation of lithium-ion batteries?',
    options: [
      'They are too expensive to produce.',
      'Their performance declines over time.',
      'They cannot be recharged.',
      'They store no chemical energy.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出"their performance gradually declines with use"，即性能随使用逐渐下降。"cannot be recharged"与文中"can be recharged hundreds of times"矛盾。',
  },
  {
    id: 't103',
    type: 'reading',
    passage:
      'Urban green spaces, such as parks and community gardens, provide more than just aesthetic value. They help reduce air pollution, lower temperatures in hot weather, and offer residents places to exercise and relax. Studies have shown that access to green spaces is associated with improved mental health and stronger community ties.',
    prompt: 'What is the main idea of the passage?',
    options: [
      'Green spaces are mainly for decoration.',
      'Urban green spaces offer multiple benefits.',
      'Parks should be replaced by buildings.',
      'Air pollution has no effect on health.',
    ],
    answerIndex: 1,
    explanation:
      '全篇列举了城市绿地的多重益处：减少空气污染、降温、提供锻炼休闲场所、改善心理健康，主旨是"城市绿地带来多重好处"。',
  },
  {
    id: 't104',
    type: 'reading',
    passage:
      'Honeybees play a vital role in agriculture by pollinating a wide variety of crops. Without them, many fruits, vegetables, and nuts would produce significantly lower yields. In recent years, bee populations have declined due to factors such as pesticide use, habitat loss, and climate change, raising concerns about food security.',
    prompt: 'Why are honeybees important to agriculture?',
    options: [
      'They produce honey for farmers.',
      'They pollinate many crops.',
      'They eat harmful insects.',
      'They improve soil quality.',
    ],
    answerIndex: 1,
    explanation:
      '文中明确"honeybees play a vital role in agriculture by pollinating a wide variety of crops"，即蜜蜂通过授粉对农业至关重要。',
  },
  {
    id: 't105',
    type: 'reading',
    passage:
      'Desalination is the process of removing salt from seawater to make it drinkable. As freshwater resources become increasingly scarce, desalination plants have grown in number, particularly in arid regions. However, the technology remains energy-intensive and expensive, and the disposal of salty brine can harm marine ecosystems.',
    prompt: 'What is a drawback of desalination mentioned in the passage?',
    options: [
      'It produces too much freshwater.',
      'It requires large amounts of energy.',
      'It is used only in cold regions.',
      'It removes too much salt.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出 desalination "remains energy-intensive and expensive"，即能耗高、成本昂贵，且盐水排放可能危害海洋生态。',
  },
  {
    id: 't106',
    type: 'reading',
    passage:
      'Renewable energy sources, such as solar and wind power, are becoming increasingly important in the global effort to reduce carbon emissions. Unlike fossil fuels, they do not produce greenhouse gases during operation. Nevertheless, their reliance on weather conditions means that energy storage systems are essential to ensure a stable supply.',
    prompt: 'According to the passage, why are energy storage systems necessary?',
    options: [
      'Renewable energy is too expensive.',
      'Solar and wind power depend on weather.',
      'Fossil fuels are running out.',
      'Greenhouse gases must be stored.',
    ],
    answerIndex: 1,
    explanation:
      '文中说明可再生能源"reliance on weather conditions means that energy storage systems are essential"，即因依赖天气，储能系统必不可少。',
  },
  {
    id: 't107',
    type: 'reading',
    passage:
      'The Great Barrier Reef, located off the coast of Australia, is the largest coral reef system in the world. It supports an extraordinary diversity of marine life and attracts millions of tourists each year. However, rising ocean temperatures have caused repeated coral bleaching events, threatening the health of the reef and the species that depend on it.',
    prompt: 'What threatens the Great Barrier Reef according to the passage?',
    options: [
      'Too many tourists.',
      'Rising ocean temperatures.',
      'Lack of marine life.',
      'Pollution from ships.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出"rising ocean temperatures have caused repeated coral bleaching events"，即海水温度上升导致的珊瑚白化是主要威胁。',
  },
  {
    id: 't108',
    type: 'reading',
    passage:
      'Remote sensing technology allows scientists to gather information about the Earth\'s surface without physical contact. Satellites equipped with sensors can monitor changes in land use, track deforestation, and measure ocean temperatures. This technology has become an indispensable tool for environmental monitoring and disaster response.',
    prompt: 'What can remote sensing technology do according to the passage?',
    options: [
      'Physically contact the Earth.',
      'Monitor environmental changes.',
      'Prevent natural disasters.',
      'Replace all ground surveys.',
    ],
    answerIndex: 1,
    explanation:
      '文中列举了遥感技术的用途：监测土地利用变化、追踪森林砍伐、测量海洋温度，即"监测环境变化"。它不接触地表，也不能预防灾害。',
  },
  {
    id: 't109',
    type: 'reading',
    passage:
      'Solar panels convert sunlight directly into electricity through the photovoltaic effect. Their efficiency, which measures how much sunlight is converted into usable power, has improved steadily over the decades. While early panels converted less than ten percent of sunlight, modern commercial panels often exceed twenty percent.',
    prompt: 'What has happened to solar panel efficiency over time?',
    options: [
      'It has decreased.',
      'It has improved.',
      'It has stayed the same.',
      'It is not measurable.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出效率"has improved steadily over the decades"，从早期不到 10% 提升到现代商用面板超过 20%。',
  },
  {
    id: 't110',
    type: 'reading',
    passage:
      'The concept of the circular economy aims to minimize waste by keeping materials in use for as long as possible. Instead of the traditional "take-make-dispose" model, products are designed to be repaired, reused, and recycled. This approach not only conserves resources but also reduces the environmental impact of manufacturing.',
    prompt: 'What is the main goal of the circular economy?',
    options: [
      'To increase production speed.',
      'To minimize waste.',
      'To dispose of materials quickly.',
      'To reduce product quality.',
    ],
    answerIndex: 1,
    explanation:
      '文中第一句即说明循环经济的目标是"minimize waste by keeping materials in use"，即通过延长材料使用周期来减少浪费。',
  },
  {
    id: 't111',
    type: 'reading',
    passage:
      'Sodium-ion batteries have attracted attention as a potential alternative to lithium-ion batteries. Sodium is far more abundant and less expensive than lithium, making these batteries cheaper to produce. However, sodium-ion batteries currently have a lower energy density, which means they are more suitable for applications where weight is not a critical factor.',
    prompt: 'What is an advantage of sodium-ion batteries mentioned in the passage?',
    options: [
      'Higher energy density.',
      'Lower production cost.',
      'Better performance in cold weather.',
      'Smaller physical size.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出钠资源丰富、价格低廉，"making these batteries cheaper to produce"，即生产成本更低是优势；而能量密度低是劣势。',
  },
  {
    id: 't112',
    type: 'reading',
    passage:
      'Standardization in manufacturing ensures that products are made to consistent specifications, which simplifies quality control and reduces costs. When components are standardized, they can be easily replaced and serviced, extending the life of equipment. International standards also enable companies in different countries to cooperate more effectively.',
    prompt: 'According to the passage, what is a benefit of standardization?',
    options: [
      'Products become more varied.',
      'Components are easier to replace.',
      'Quality control becomes harder.',
      'International cooperation declines.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出标准化组件"can be easily replaced and serviced, extending the life of equipment"，即可轻松更换维修、延长设备寿命。',
  },
  {
    id: 't113',
    type: 'reading',
    passage:
      'Predictive maintenance uses sensors and data analysis to detect equipment problems before they cause failures. By monitoring vibration, temperature, and other indicators, maintenance teams can schedule repairs at the most convenient times. This approach reduces unexpected downtime and extends the service life of machinery.',
    prompt: 'How does predictive maintenance help manufacturers?',
    options: [
      'It eliminates all equipment failures.',
      'It reduces unexpected downtime.',
      'It requires no sensors.',
      'It increases maintenance costs.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出预测性维护"reduces unexpected downtime and extends the service life of machinery"，即减少意外停机、延长设备寿命。它不能消除所有故障，且需要传感器。',
  },
  {
    id: 't114',
    type: 'reading',
    passage:
      'The invention of the assembly line by Henry Ford in 1913 revolutionized automobile manufacturing. By moving the work to stationary workers, the assembly line dramatically reduced the time needed to build a car. This innovation made automobiles affordable for the general public and set a new standard for mass production across industries.',
    prompt: 'What was the direct effect of the assembly line on car manufacturing?',
    options: [
      'It made cars more expensive.',
      'It reduced production time.',
      'It required more workers per car.',
      'It eliminated the need for factories.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出流水线"dramatically reduced the time needed to build a car"，即大幅缩短了造车时间，使汽车价格下降、大众可负担。',
  },
  {
    id: 't115',
    type: 'reading',
    passage:
      'Microplastics, tiny plastic particles less than five millimeters in size, have been found in oceans, rivers, and even drinking water. They come from the breakdown of larger plastic items as well as from products such as cosmetics and synthetic clothing. Researchers are studying their potential effects on human health and ecosystems.',
    prompt: 'What is one source of microplastics mentioned in the passage?',
    options: [
      'Natural minerals.',
      'Synthetic clothing.',
      'Glass bottles.',
      'Paper products.',
    ],
    answerIndex: 1,
    explanation:
      '文中提到微塑料来自大型塑料制品的分解，也来自"products such as cosmetics and synthetic clothing"，即化妆品和合成纤维衣物。',
  },
  {
    id: 't116',
    type: 'reading',
    passage:
      'Lean manufacturing is a production philosophy that focuses on eliminating waste while maintaining quality. Waste can take many forms, including excess inventory, unnecessary movement, and waiting time. By continuously improving processes and involving workers in problem-solving, lean manufacturing helps companies become more efficient and responsive to customer needs.',
    prompt: 'What does lean manufacturing primarily focus on?',
    options: [
      'Increasing inventory levels.',
      'Eliminating waste.',
      'Slowing down production.',
      'Reducing worker involvement.',
    ],
    answerIndex: 1,
    explanation:
      '文中第一句即说明精益制造的核心是"eliminating waste while maintaining quality"，即消除浪费、保持质量。',
  },
  {
    id: 't117',
    type: 'reading',
    passage:
      'The greenhouse effect is a natural process in which certain gases in the atmosphere trap heat from the sun, keeping the Earth warm enough to support life. However, human activities such as burning fossil fuels have increased the concentration of these gases, intensifying the effect and leading to global warming.',
    prompt: 'According to the passage, what has intensified the greenhouse effect?',
    options: [
      'Natural volcanic activity.',
      'Human burning of fossil fuels.',
      'The Earth cooling down.',
      'Reduced atmospheric gases.',
    ],
    answerIndex: 1,
    explanation:
      '文中指出人类活动"such as burning fossil fuels have increased the concentration of these gases, intensifying the effect"，即燃烧化石燃料加剧了温室效应。',
  },
  {
    id: 't118',
    type: 'reading',
    passage:
      'Quality control charts are tools used in manufacturing to monitor process stability over time. By plotting sample measurements against control limits, engineers can quickly identify when a process is drifting out of specification. This allows corrective action to be taken before defective products are produced in large quantities.',
    prompt: 'What is the purpose of a control chart?',
    options: [
      'To increase product defects.',
      'To monitor process stability.',
      'To slow down production.',
      'To replace all inspectors.',
    ],
    answerIndex: 1,
    explanation:
      '文中说明控制图"used in manufacturing to monitor process stability over time"，即用于监测生产过程的稳定性，以便及时纠偏。',
  },
  {
    id: 't119',
    type: 'reading',
    passage:
      'Energy storage systems, including batteries and pumped hydro, play a crucial role in integrating renewable energy into the power grid. Because solar and wind power are intermittent, storage allows excess energy to be saved when production is high and released when demand exceeds supply. This helps maintain a stable and reliable electricity supply.',
    prompt: 'Why is energy storage important for renewable energy?',
    options: [
      'It increases energy production.',
      'It balances intermittent supply.',
      'It eliminates the need for grids.',
      'It only works with fossil fuels.',
    ],
    answerIndex: 1,
    explanation:
      '文中说明由于太阳能和风能具有间歇性，储能系统可在产量高时储存、需求高时释放，"helps maintain a stable and reliable electricity supply"，即平衡间歇性供给。',
  },
  {
    id: 't120',
    type: 'reading',
    passage:
      'Failure mode and effects analysis, or FMEA, is a systematic method used to identify potential failure modes in a product or process and assess their impact. Teams evaluate each potential failure based on its severity, occurrence, and detection difficulty to calculate a risk priority number. This allows them to focus improvement efforts on the highest-risk areas.',
    prompt: 'What is the purpose of calculating a risk priority number in FMEA?',
    options: [
      'To eliminate all failures completely.',
      'To prioritize the highest-risk areas.',
      'To increase the number of failures.',
      'To replace human engineers.',
    ],
    answerIndex: 1,
    explanation:
      '文中说明风险优先数用于评估每个潜在失效的严重度、发生频率和可检测性，使团队能够"focus improvement efforts on the highest-risk areas"，即优先处理风险最高的区域。',
  },
]
