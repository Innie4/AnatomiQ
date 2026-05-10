const topics = [
  'cardiovascular-system',
  'respiratory-system',
  'nervous-system',
  'skeletal-system',
  'muscular-system',
  'digestive-system',
  'urinary-system',
  'reproductive-system',
];

const types = ['MCQ', 'SHORT_ANSWER', 'THEORY', 'MIXED'];

module.exports = {
  setRandomTopic: function (requestParams, context, ee, next) {
    context.vars.$randomTopic = topics[Math.floor(Math.random() * topics.length)];
    return next();
  },

  setExamPayload: function (requestParams, context, ee, next) {
    context.vars.courseSlug = 'human-anatomy';
    context.vars.topicSlug = topics[Math.floor(Math.random() * topics.length)];
    context.vars.type = types[Math.floor(Math.random() * types.length)];
    context.vars.count = Math.floor(Math.random() * 13) + 8; // 8-20
    return next();
  },
};
