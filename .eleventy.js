const pug = require('pug');

module.exports = eleventyConfig => {
  eleventyConfig.setPugOptions({ debug: true });

  eleventyConfig.htmlTemplateEngine = 'pug';
  eleventyConfig.setLibrary('pug', pug);
  eleventyConfig.setTemplateFormats(['pug']);

  eleventyConfig.dir = {
    input: 'src/_pages',
    includes: '../_includes',
    output: 'public',
  };

  if (process.env.NODE_ENV !== 'production') {
    eleventyConfig.addPassthroughCopy({ 'src/assets/img': 'assets/img' });
    eleventyConfig.addPassthroughCopy({ 'src/assets/icons': 'assets/icons' });
    eleventyConfig.addPassthroughCopy({ 'src/assets/css': 'assets/css' });
    eleventyConfig.addPassthroughCopy({ 'src/assets/js': 'assets/js' });
    eleventyConfig.addPassthroughCopy({ 'src/data/': 'data/' });
    eleventyConfig.addPassthroughCopy({
      'src/components': 'assets/js/components',
    });
    eleventyConfig.addWatchTarget('./src/assets/');
    eleventyConfig.addWatchTarget('./src/components/');
  } else {
    eleventyConfig.addPassthroughCopy({ 'src/assets/img': 'assets/img' });
    eleventyConfig.addPassthroughCopy({ 'src/assets/icons': 'assets/icons' });
    eleventyConfig.addPassthroughCopy({ 'src/assets/css': 'assets/css' });
    eleventyConfig.addPassthroughCopy({ 'src/assets/js': 'assets/js' });
    eleventyConfig.addPassthroughCopy({ 'src/data/': 'data/' });
    eleventyConfig.addPassthroughCopy({
      'src/components': 'assets/js/components',
    });
  }

  return eleventyConfig;
};
