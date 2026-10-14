// Topic and concern tags are already part of the compact stored task. Do not
// store another profile, raw note or AI biography to recover these signals.
export const privatePrefix = topicId => `custom_${topicId}_`;
export function privateAction(item, topic) {
  return {
    actionKey: item.state.actionKey, contentRef: item.state.contentRef,
    outcomeGroup: item.state.actionKey, reviewState: 'editorial_review',
    topicIds: [topic.id], concernIds: item.content.concern_ids,
    tags: item.content.concern_ids, outcome: item.content.done_when,
    requiresSpending: false, requiresNearbySupport: false, task: item.content
  };
}
