/** Ada's supplied background and philosophy. Keep personal facts grounded in her words. */
export const aboutContent = {
  meta: {
    title: 'About Ada, Creator of My Safety | My Safety',
    description: 'Meet Ada, the creator of My Safety. After more than seven years of living on her own with her cat, she is building a peaceful place to embrace solo living.',
  },
  introduction: 'I’ve lived on my own for more than seven years, with my cat. I’m building My Safety as a peaceful place for women living independently to embrace solo living and enjoy it fully.',
  story: [
    {
      heading: 'Why I’m building My Safety',
      body: 'I don’t like fear-based content that keeps us scrolling without helping us take action. I want the time you spend here to give you something useful: a little clarity, a practical step, and more room to enjoy your life.',
    },
    {
      heading: 'The place I want to create',
      body: 'My hope is for a calm corner of the internet where we can feel at home in our solo lives. A place to think about what would make everyday life feel more supported, and take it at our own pace.',
    },
  ],
  principles: [
    {
      title: 'Make room for the life you enjoy.',
      body: 'I want preparation to support your everyday life. The point is to have more space for the things that make it yours.',
    },
    {
      title: 'Begin with something small.',
      body: 'One useful contact, one arrangement for your cat, one place for important information. A step you can actually take is a good place to start.',
    },
    {
      title: 'Let support fit your life.',
      body: 'Our time, energy, budgets, and people are different. I want My Safety to make room for that, and for asking for help to feel ordinary.',
    },
  ],
  closing: 'I hope you leave here with a little more clarity and something useful for your own life. Take your time. Start wherever feels right for you.',
};

export const aboutStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: aboutContent.meta.title,
  description: aboutContent.meta.description,
  mainEntity: {
    '@type': 'Person',
    name: 'Ada',
    description: 'Creator of My Safety. Ada has lived on her own for more than seven years with her cat.',
  },
  about: {
    '@type': 'Organization',
    name: 'My Safety',
    founder: { '@type': 'Person', name: 'Ada' },
    description: 'A project creating a peaceful place for women living independently to embrace solo living and take practical steps at their own pace.',
  },
};
