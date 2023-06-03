[
  'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display:wght@300;400;500;600;700&display=swap',
].forEach(function (f) {
  const gf = document.createElement('link');
  gf.rel = 'stylesheet';
  gf.href = f;
  gf.type = 'text/css';
  const gd = document.getElementsByTagName('link')[0];
  gd.parentNode.insertBefore(gf, gd);
});
