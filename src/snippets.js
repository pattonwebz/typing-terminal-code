// Snippet banks, one pool per era (see src/data/eras.js `snippetPool`).
// Within a pool, snippets are tiered by difficulty; higher tiers pay more
// and unlock as lifetime LoC grows.
export const TIERS = [
  { name: 'Warm-up', unlockAt: 0, multiplier: 1 },
  { name: 'Standard', unlockAt: 500, multiplier: 1.5 },
  { name: 'Gnarly', unlockAt: 5000, multiplier: 2.5 },
]

export const SNIPPET_POOLS = {
  html: [
    // Tier 0
    { tier: 0, code: `<b>Welcome to my homepage!</b>` },
    { tier: 0, code: `<font color="red">NEW!</font>` },
    { tier: 0, code: `<img src="construction.gif">` },
    { tier: 0, code: `<a href="links.html">My Links</a>` },
    { tier: 0, code: `<br><br><hr><br>` },
    { tier: 0, code: `<center><h1>GUESTBOOK</h1></center>` },
    { tier: 0, code: `<body bgcolor="#000080" text="#FFFF00">` },
    { tier: 0, code: `<marquee>Thanks for visiting!!!</marquee>` },
    // Tier 1
    { tier: 1, code: `<table border="1" cellpadding="5"><tr><td>Home</td><td>About</td></tr></table>` },
    { tier: 1, code: `<font face="Comic Sans MS" size="5">Under Construction</font>` },
    { tier: 1, code: `<img src="counter.cgi?page=index" alt="You are visitor #000451">` },
    { tier: 1, code: `<blink><font color="lime">HOT DEALS THIS WEEK ONLY</font></blink>` },
    { tier: 1, code: `<table width="100%" bgcolor="silver"><tr><td align="center">MENU</td></tr></table>` },
    { tier: 1, code: `<a href="mailto:webmaster@geocities.com">Email the Webmaster</a>` },
    // Tier 2
    {
      tier: 2,
      code: `<frameset cols="20%,80%">\n  <frame src="nav.html" name="nav">\n  <frame src="main.html" name="main">\n  <noframes>Your browser does not support frames.</noframes>\n</frameset>`,
    },
    {
      tier: 2,
      code: `<table border="0" cellspacing="0" cellpadding="0" width="640">\n  <tr>\n    <td colspan="2"><img src="banner.jpg" width="640" height="120"></td>\n  </tr>\n  <tr>\n    <td width="160" bgcolor="#C0C0C0" valign="top">links</td>\n    <td width="480">content</td>\n  </tr>\n</table>`,
    },
    {
      tier: 2,
      code: `<map name="navmap">\n  <area shape="rect" coords="0,0,100,40" href="home.html">\n  <area shape="rect" coords="100,0,200,40" href="pics.html">\n</map>`,
    },
  ],

  php: [
    // Tier 0
    { tier: 0, code: `<?php echo "Hello, World!"; ?>` },
    { tier: 0, code: `$name = $_GET['name'];` },
    { tier: 0, code: `include 'header.php';` },
    { tier: 0, code: `if ($logged_in) { echo "Welcome back"; }` },
    { tier: 0, code: `$count = $count + 1;` },
    { tier: 0, code: `session_start();` },
    // Tier 1
    { tier: 1, code: `$result = mysql_query("SELECT * FROM users WHERE id = $id");` },
    { tier: 1, code: `foreach ($rows as $row) { echo "<li>" . $row['title'] . "</li>"; }` },
    { tier: 1, code: `if (isset($_POST['submit'])) { save_comment($_POST['body']); }` },
    { tier: 1, code: `header("Location: index.php?msg=" . urlencode($msg));` },
    { tier: 1, code: `$config = array('host' => 'localhost', 'db' => 'db_final_v2_REAL');` },
    // Tier 2
    {
      tier: 2,
      code: `function get_user($id) {\n  global $db;\n  $q = mysql_query("SELECT * FROM users WHERE id = " . intval($id));\n  return mysql_fetch_assoc($q);\n}`,
    },
    {
      tier: 2,
      code: `<?php\n$page = isset($_GET['page']) ? $_GET['page'] : 'home';\nswitch ($page) {\n  case 'about': include 'about.php'; break;\n  default: include 'home.php';\n}\n?>`,
    },
    {
      tier: 2,
      code: `error_reporting(E_ALL);\nini_set('display_errors', 1);\n// TODO: remove before launch\n// TODO(2007): seriously, remove this`,
    },
  ],

  js: [
    // Placeholder pool until step 7 fleshes out the JS era: early-jQuery vibes.
    { tier: 0, code: `$('#menu').toggle();` },
    { tier: 0, code: `alert('Form submitted!');` },
    { tier: 0, code: `var total = price * qty;` },
    { tier: 1, code: `$('.tab').click(function() { $(this).addClass('active'); });` },
    { tier: 1, code: `$.get('ajax.php', function(data) { $('#result').html(data); });` },
    {
      tier: 2,
      code: `$(document).ready(function() {\n  $('#slider').fadeIn('slow', function() {\n    setInterval(nextSlide, 3000);\n  });\n});`,
    },
  ],

  spa: [
    // Tier 0
    { tier: 0, code: `console.log("hello world");` },
    { tier: 0, code: `let count = 0;` },
    { tier: 0, code: `const sum = a + b;` },
    { tier: 0, code: `if (x > 10) return true;` },
    { tier: 0, code: `items.push(newItem);` },
    { tier: 0, code: `const name = user.name;` },
    { tier: 0, code: `for (let i = 0; i < 10; i++) {}` },
    { tier: 0, code: `return arr.length;` },
    // Tier 1
    { tier: 1, code: `const evens = nums.filter(n => n % 2 === 0);` },
    { tier: 1, code: `document.querySelector("#app").textContent = "done";` },
    { tier: 1, code: `const total = prices.reduce((a, b) => a + b, 0);` },
    { tier: 1, code: `setTimeout(() => console.log("tick"), 1000);` },
    { tier: 1, code: `const { id, name } = await fetchUser(userId);` },
    { tier: 1, code: `export default function App() { return <h1>Hi</h1>; }` },
    { tier: 1, code: `const sorted = [...items].sort((a, b) => a.rank - b.rank);` },
    // Tier 2
    {
      tier: 2,
      code: `const debounce = (fn, ms) => {\n  let t;\n  return (...args) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), ms);\n  };\n};`,
    },
    {
      tier: 2,
      code: `async function retry(fn, tries = 3) {\n  for (let i = 0; i < tries; i++) {\n    try { return await fn(); } catch (e) {}\n  }\n  throw new Error("out of retries");\n}`,
    },
    {
      tier: 2,
      code: `const groupBy = (arr, key) =>\n  arr.reduce((acc, item) => {\n    (acc[item[key]] ??= []).push(item);\n    return acc;\n  }, {});`,
    },
  ],

  // AI-era "snippets" are prompts; the real mechanic lands in step 9.
  ai: [
    { tier: 0, code: `Fix the login bug. Do not touch anything else. Please.` },
    { tier: 1, code: `Refactor the checkout flow. Keep all tests green. Explain nothing.` },
    {
      tier: 2,
      code: `The dashboard is slow. Profile it, find the N+1 query, fix it, and this time do not "optimize" by deleting the feature.`,
    },
  ],
}

export function availableTiers(totalLoc) {
  return TIERS.map((t, i) => i).filter((i) => totalLoc >= TIERS[i].unlockAt)
}

export function randomSnippet(pool, totalLoc, excludeCode) {
  const bank = SNIPPET_POOLS[pool] ?? SNIPPET_POOLS.spa
  const tiers = availableTiers(totalLoc)
  const candidates = bank.filter(
    (s) => tiers.includes(s.tier) && s.code !== excludeCode
  )
  const source = candidates.length > 0 ? candidates : bank
  return source[Math.floor(Math.random() * source.length)]
}
