# Sources for the 30-task sick-day candidate pool

## October 13 checkbox review — research interpretation

Ada asked how research should improve the six concern choices. Revisited the saved Buildpad report and earlier social research, then reopened the sources below. This is a bounded qualitative refresh, not a representative survey, exhaustive social search or measured ranking. Reddit participants are self-selected; LivingAlone is mixed-gender and geography is often unknown. No vote counts are used to order the menu. Some page-relative dates disagree with cached dates, so no new exact post-date claims are made here.

| Reopened source | Relevant observation | Confidence and product implication |
| --- | --- | --- |
| [AskWomenOver30: hardest parts of living alone](https://www.reddit.com/r/AskWomenOver30/comments/1nddxyv/what_are_the_hardest_parts_about_being_single_and/) | Replies distinguish enjoying independence from doing all the food, house and pet care while ill. | Moderate qualitative support alongside other threads: prioritize relief from real responsibilities without assuming unhappiness. Pet care should remain separately selectable. |
| [LivingAlone: sick, but prepared](https://www.reddit.com/r/LivingAlone/comments/1sya5fz/im_sick_but_prepared/) | Delivery works for some; others describe cost and a building without a buzzer, requiring them to go downstairs. Some prefer solitude while ill. | Moderate qualitative support for checking usability and affordability, rather than merely recommending an app. Do not assume everyone wants company. |
| [LivingAlone: sick with nobody around to help](https://www.reddit.com/r/LivingAlone/comments/1r9pr2e/how_do_you_handle_being_sick_when_no_one_is/) | The original post asks both for practical supply help and a check-in; replies differ on wanting contact and availability of existing support. | Moderate qualitative support for separating practical help from a desired check-in. Neither implies a willing local helper exists. |
| [LivingAlone: a system for getting sick](https://www.reddit.com/r/LivingAlone/comments/1w74s6k/whats_your_system_for_getting_sick_when_you_live/) | A poster describes preparing after an illness and considering a sister in another city as a contact. | Low alone, supporting the wider pattern: anticipation and remote contact are distinct from hands-on local care. The post's treatment suggestions are not adopted. |
| [Korea's 2023 Family Survey](https://www.mogef.go.kr/nw/enw/nw_enw_s001d.do?mid=mda700&bbtSn=711884) | Official text again confirms illness/emergency coping ranked first among women in its single-person-household sample. | Moderate support for investigating this category; low transferability of exact rank to younger US women. The 37.6% figure covers all single-person respondents, and 52.8% of that sample was aged 60 or older. It does not rank our six proposed choices. |

Product recommendation, pending founder review: merge the vague home-rest concern with concrete household/errand help, and separate an optional check-in from practical help. Keep six choices overall, with work/study last because its direct evidence is weaker in this material; this is a product hypothesis, not a demonstrated prevalence ranking. Food, care access, practical help, check-ins and pet care have distinct outcomes. Current selections and known circumstances should override default display order.

Selection needs both the desired outcome and the actual gap. Reuse known context; when it materially changes the answer, ask one targeted question about whether an option is missing, uncertain or already workable. Do not add a compulsory questionnaire. Paid services are possible routes, not defaults for everyone. No nearby helper should lead to researching eligible external help rather than an assumed friend. Check-ins remain optional and no monitoring service is promised.

The existing thirty candidates and runtime remain unchanged. The exact labels and improvement in task relevance need founder review and a small user test; track whether a suggestion was new/useful and produced a usable option, rather than treating task completion alone as proof of benefit.

Checked October 12, 2026. This is a content-research record, not clinical, legal or professional approval. The [candidate pool](../personalization/content-candidates/sick-care-v0/pool.json) contains original task writing. Sources support specific facts or the existence of a starting route; they do not establish task effectiveness, personal eligibility or local availability.

Primary public guidance and providers' own descriptions inform the instructions. Reddit supplies lived-problem inspiration only. No medication, remedy, symptom threshold or treatment recommendation was adopted. Prices, promotional offers and claimed availability were deliberately omitted. US resources must not be sent to someone in another country without a checked local equivalent. A company's site describes its service; it is not independent evidence of quality.

IDs below connect the research to each task. `source_ids` are internal evidence. `resource_ids` identify links potentially shown to the user; a batch may contain links in at most one task, with at most two links in it. A source citation in this research file does not consume a user's resource slot.

### HHS_FIND

[HHS: scheduling telehealth](https://telehealth.hhs.gov/patients/how-do-i-schedule-telehealth-appointment). Opened. Insurers can help identify access routes; health centers are another starting point. Used in SC01. Establish new-patient access, location eligibility and cost with the actual provider. No assumption that every plan includes the same service.

### HRSA

[HRSA: affordable care](https://www.hrsa.gov/get-health-care/affordable) and its [health-center finder](https://findahealthcenter.hrsa.gov/). Official guidance opened; finder is the linked referral destination, not a completed local search. Health centers serve insured and uninsured people. Used in SC01/SC02. Fees, accepting new patients and virtual first visits require confirmation at the selected center.

### HC_NETWORK

[HealthCare.gov: plan and network types](https://www.healthcare.gov/choose-a-plan/plan-types/). Official search extract read. Supports using the person's own plan directory in SC02. A directory entry is not confirmation of current availability or personal coverage; both must be checked.

### HHS_PREP

[HHS: before a telehealth visit](https://telehealth.hhs.gov/patients/what-should-i-know-before-my-telehealth-visit). Opened. Supports checking joining instructions, accessibility and technology. Used in SC03; medical preparation instructions from the page are outside this task.

### HHS_TECH

[HHS: what is needed for telehealth](https://telehealth.hhs.gov/patients/what-do-i-need-use-telehealth) and [provider guidance on technology setup](https://telehealth.hhs.gov/providers/preparing-patients-for-telehealth/getting-patients-set-up-with-new-technology). Search content read. Supports a connection test and asking about appropriate alternatives in SC03. A practice visit or phone alternative is provider-dependent, not guaranteed.

### MEDICAID_RIDES

[Medicaid: transportation assurance](https://www.medicaid.gov/medicaid/benefits/assurance-of-transportation). Official content read. Nonemergency transport can be an access route for eligible beneficiaries; state/plan arrangements vary. Used in SC04 only when enrollment is explicitly known. Not an emergency service or a universal free taxi benefit.

### LOCAL_211

[211: local finder](https://211.org/about-us/your-local-211) and [about the service](https://www.211.org/about-us). Finder opened; service description read. Offers information/referrals for local needs. Used in SC04/SC18. Does not itself book transport, supply an errand helper or guarantee a free program. The app must distinguish a referral from confirmed assistance.

### MEDLINE_SURGERY

[MedlinePlus: the day of surgery](https://www.medlineplus.gov/ency/patientinstructions/000578.htm). Official page extract read. Illustrates why a responsible escort can be required beyond an ordinary ride. Used in SC05. The actual procedure team's requirements control; the pool does not reproduce recovery restrictions or make treatment decisions.

### CMS_ESTIMATE

[CMS: medical-bill rights without insurance](https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights/know-your-rights/without-insurance). Full returned page text read. Explains written good-faith estimates for US uninsured/self-pay planned care and that emergency care differs. Used in SC06 as a way to ask the provider, not a personalized legal eligibility determination or promise that an estimate covers every bill.

### CVS_DELIVERY

[CVS Health: prescription delivery](https://www.cvshealth.com/services/pharmacy/prescription-delivery.html). Opened. Distinguishes local prescription delivery from mail-order service. Used in SC07 as a US example to investigate. Page contains potentially dated membership language: no prices, brand-benefit claims or timing guarantees are imported. Check the specific pharmacy, prescription, coverage and handoff directly.

### HC_PHARMACY

[HealthCare.gov: prescription access](https://www.healthcare.gov/using-marketplace-coverage/prescription-medications/). Official returned text read. Supports checking a plan's pharmacy network in SC07. Drug selection, exceptions, dosage and newly promoted price programs on the page were not adopted.

### CDC_RX

[CDC: prescription preparation](https://www.cdc.gov/prepare-your-health/take-action/prescriptions.html). Official content read; dated April 18, 2024. Its scope is emergency preparation. SC08 borrows only the principle of asking the pharmacist/prescriber about access ahead of time. Routine refill timing is a question for the professional, not a fact supplied by this page. No stockpiling, emergency-refill law or medication-list storage is prescribed by My Safety.

### HHS_PICKUP

[HHS: collection by a friend or relative](https://www.hhs.gov/hipaa/for-professionals/faq/can-a-patient-have-a-friend-or-family-member-pick-up-a-prescription/index.html). Official returned text read; older FAQ remains published. It permits pharmacist judgment rather than promising collection in every case. Used in SC09, which asks the actual pharmacy about its requirements. An earlier guessed `/for-individuals/faq/535/` URL failed and is not a resource link.

### WALMART_DELIVERY

[Walmart: delivery terms](https://www.walmart.com/help/article/walmart-terms-of-use/de696dfa1dd4423bb1005668dd19b845). Official terms extract read. Illustrates how order minimums and extra fees can vary in SC10. No current price, membership recommendation or delivery-location promise is copied. The task starts with the user's own grocer and actual order preview.

### INSTACART_EBT

[Instacart: EBT-eligible purchases and fees](https://www.instacart.com/help/section/xmiq4k9kz/360047747451). Official returned text read. EBT does not cover all ancillary charges on this service. Used only in the conditional SC10 variant when the person explicitly mentions using EBT. Do not infer benefit status or assert another retailer's terms.

### FEEDING_AMERICA

[Feeding America: finding food](https://www.feedingamerica.org/need-help-find-food). Opened. Provides a local food-bank starting route for temporary food needs. Used in SC11. Home delivery, collection by another person, program rules and specific availability remain questions for the local organization.

### CDC_NEEDS

[CDC: personal needs](https://www.cdc.gov/prepare-your-health/take-action/personal-needs.html). Official extract read; emergency-preparedness scope. Supports considering personal ordinary supplies and access, not a universal sick-day shopping list. Used in SC12–SC14. Specific trial/rearrangement/replenishment tasks are original editorial designs; they are not interventions clinically validated by CDC.

### FOODKEEPER

[USDA FoodKeeper via FoodSafety.gov](https://www.foodsafety.gov/keep-food-safe/foodkeeper-app). Official content read. A searchable food-storage reference, also described as a mobile app. Used in SC15. Match the actual food and its condition; do not turn a generic AI answer into a food-safety clearance.

### FOOD_STORAGE

[FoodSafety.gov: cold-food storage](https://www.foodsafety.gov/food-safety-charts/cold-food-storage-charts). Official content read. Different products and storage conditions need different guidance. Supports SC15; no universal storage duration is invented or assigned to unidentified food.

### TASK_LAUNDRY

[Taskrabbit: laundry help](https://www.taskrabbit.com/services/cleaning/laundry-help). Provider's returned page text read. Describes laundry and collection services. Used in SC16 as one research starting point alongside local laundromats. Local supply, prices, acceptance policies and return times need direct checking; no same-day claim is adopted.

### TASK_CLEANING

[Taskrabbit: house cleaning](https://www.taskrabbit.com/services/cleaning/house-cleaning). Provider's returned page text read. Supports researching the actual scope of household help in SC17. Provider marketing is not evidence of quality or suitability. No prices, background-check guarantees or advice to disclose access codes is copied.

### TASK_ERRANDS

[Taskrabbit: shopping and delivery](https://www.taskrabbit.com/services/shopping-delivery). Opened. A paid errand-help route to investigate in supported locations, used in SC18. Verify that the specific job is offered. No implication of healthcare, pharmacy collection, emergency response or guaranteed availability.

### DOL_LEAVE

[US Department of Labor: talking to an employer about leave](https://www.dol.gov/agencies/whd/fmla/how-to-talk-to-your-employer-about-leave). Official extract read. Its FMLA scope has eligibility conditions; SC22 does not extend those rights to ordinary sick days or students. The task directs users to their own workplace/course process. The general sick-leave page returned 403 and was not treated as verified evidence.

### ETSY_PAUSE

[Etsy: vacation mode](https://help.etsy.com/hc/en-us/articles/115015662947-How-to-Manage-Vacation-Mode-for-Your-Shop). Official returned page text read. New orders can be paused while existing commitments and some fees continue. Used in SC24 only for Etsy users. Other business platforms require their own checked instructions. Research preparation does not authorize changing a live business.

### CARE_BENEFITS

[CareBenefits: employer care support](https://www.care.com/benefits/backup-care/) and [eligibility FAQ](https://www.care.com/benefits/faq/backup-care-for-children-and-adults/). Official returned text read. Demonstrates that some employers offer practical care benefits with specific eligible situations. Used in SC25. It does not establish that personal sick leave qualifies, that a particular employer participates, or that pet/adult care is included. The provider's product name is not adopted as My Safety's copy.

### PSI_FIND

[Pet Sitters International: sitter finder](https://www.petsit.com/locate). Opened. Directory for independent member businesses; PSI explicitly does not inspect, endorse or guarantee listings. Used in SC26. Coverage, species, experience, pricing and availability must be checked with the business.

### PSI_STANDARDS

[PSI: industry standards](https://www.petsit.com/standards). Published industry guidance read. Includes client meetings, clear service arrangements and continuity planning. Used in SC27 as practical questions, not certification of a candidate. An introduction and a future booking are separate outcomes.

### RED_CROSS_PETS

[American Red Cross: pet preparedness](https://www.redcross.org/get-help/how-to-prepare-for-emergencies/pet-disaster-preparedness.html). Returned content read; disaster context, primarily dogs/cats. Supports useful routine/care information for another carer in SC27. The ordinary handoff does not imply a disaster plan or clinical pet-care instructions.

### AVMA_PETS

[American Veterinary Medical Association: pets and disasters](https://avma.org/public/EmergencyCare/Pages/Pets-and-Disasters.aspx). Official extract read. Mentions veterinary treatment authorization when owners are absent. SC28 applies this as a question for the user's vet, not an AI-drafted legal authorization or treatment recommendation.

### HUMANE_FOSTER

[Humane World for Animals: fostering](https://www.humaneworld.org/us/en/resources/pet-fostering-101). Official returned content read. Describes temporary fostering of owned pets, including during hospitalization. Supports the existence of this type of help in SC29, not a locator or assurance of local placement. Ask the local organization about eligibility, capacity, agreements and return arrangements.

### MEDLINE_DISCHARGE

[MedlinePlus: planning to leave hospital](https://www.medlineplus.gov/ency/patientinstructions/000867.htm). Official content read. Supports asking the care team about household/personal support and coordination in SC30. The app does not decide recovery requirements, prescribe equipment or equate a cleaner with a healthcare professional.

### REDDIT_SICKBOX

[r/LivingAlone: Sick Box](https://www.reddit.com/r/LivingAlone/comments/1h3rkf0/sick_box/). Reopened and ordinary food/accessibility replies read. Inspiration for preparation with familiar supplies in SC12/SC13. Earlier indexed attention observations are preserved in [the prior research](../personalization/sick-care-research.md); scores were not visible in this opened page. Medication and remedy recommendations were rejected.

### REDDIT_ILLNESS

[r/LivingAlone: Illness when living alone](https://www.reddit.com/r/LivingAlone/comments/1l9jqza/). Search extract read; direct page fetch failed. Indexed post dated June 12, 2025 showed +297, with a reply +93, on this check. Scores are cached attention signals, not verified rankings. The extract describes food-delivery expense, pet duties and desire for practical/company support. Used as problem inspiration, not proof that SC10/SC14/SC19/SC20 work; high-vote emotional testimony is not practical or medical authority.

### FOUNDER

[Founder voice](../docs/founder-voice.md) and [personalization plan](../docs/personalization-plan-v0.md). First-party product requirements. SC19–SC23 include original mutual-agreement/handoff exercises, not externally validated interventions. SC14 and other basic actions are gated to explicit gaps; they should not dominate first recommendations for someone seeking unfamiliar options.

## Research implications

- Give the user a concrete route and one or two decisive checks. Source links alone do not constitute useful help.
- Establish current fit, including whether a service is usable without an existing doctor, nearby contact or membership.
- A familiar action may help when she describes that gap; novelty is not a reason to prescribe an unnecessary task.
- Do not create three task records for insured, uninsured and self-pay versions of the same care-access outcome.
- A researched source and a well-intentioned task are still not evidence of user benefit. Founder review and real use remain next checks.
- The Alone Actually reference informs depth and organization; its contractor content is not evidence for healthcare instructions.
