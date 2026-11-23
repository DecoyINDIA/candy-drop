'use strict';

/**
 * Pixel art matrices and color palettes for Arcade Universe brand assets.
 * 0 or '.' represents transparent. Other characters map to hex colors in each sprite's palette.
 */

// Helper to expand ascii string matrix into 2D array of colors
function parseSprite(lines, palette) {
  return lines.map(row => {
    const rowColors = [];
    for (let char of row) {
      if (char === '.' || char === ' ' || char === '0') {
        rowColors.push(null);
      } else {
        rowColors.push(palette[char] || '#ffffff');
      }
    }
    return rowColors;
  });
}

// 8 Frames of a rotating golden arcade coin (16x16 pixels)
const coinPalette = {
  'k': '#1a1005', // dark rim
  'd': '#b87800', // shadow gold
  'g': '#ffc000', // base gold
  'l': '#ffea60', // highlight gold
  'w': '#ffffff', // specular white
  's': '#e69000'  // star/candy stamp
};

// 8 angle frames of spinning coin: 0, 45, 90, 135, 180, 225, 270, 315
const coinFrames = [
  // Frame 0: Full face
  parseSprite([
    "....kkkkkkk.....",
    "..kklllllllkk...",
    ".kllgggggggldk..",
    "kllgggwswggglk..",
    "kllggwwswwggldk.",
    "kllgsssssssggldk",
    "kllgwwswwggglldk",
    "kllgggwswggglldk",
    "kllggggggggglldk",
    "klldddddddddldk.",
    ".klddddddddddk..",
    "..kkdddddddkk...",
    "....kkkkkkk....."
  ], coinPalette),

  // Frame 1: 3/4 turn
  parseSprite([
    ".....kkkkkk.....",
    "...kkllllllkk...",
    "..kllggggggldk..",
    ".kllggwswgggldk.",
    ".kllgwswwgggldk.",
    ".kllgsssssggldk.",
    ".kllgwswwgggldk.",
    ".kllggwswgggldk.",
    ".kllggggggggldk.",
    "..kllddddddddk..",
    "...kkdddddddk...",
    ".....kkkkkk....."
  ], coinPalette),

  // Frame 2: Half turn
  parseSprite([
    "......kkkk......",
    "....kkllllkk....",
    "...kllggglldk...",
    "..kllgwswglldk..",
    "..kllgswsglldk..",
    "..kllgssglldk...",
    "..kllgwswglldk..",
    "..kllggggglldk..",
    "...kldddddldk...",
    "....kkddddkk....",
    "......kkkk......"
  ], coinPalette),

  // Frame 3: Thin angle
  parseSprite([
    ".......kk.......",
    ".....kkllkk.....",
    "....kllggldk....",
    "...kllgswglldk..",
    "...kllgswglldk..",
    "...kllgssglldk..",
    "...kllgswglldk..",
    "....kldddldk....",
    ".....kkddkk.....",
    ".......kk......."
  ], coinPalette),

  // Frame 4: Edge-on
  parseSprite([
    "........kk......",
    ".......klk......",
    "......kllk......",
    "......kglk......",
    "......kglk......",
    "......kglk......",
    "......kglk......",
    "......kldk......",
    ".......kdk......",
    "........kk......"
  ], coinPalette),

  // Frame 5: Reverse thin angle
  parseSprite([
    ".......kk.......",
    ".....kkddkk.....",
    "....kdlgldk.....",
    "...kdllgswldk...",
    "...kdllgswldk...",
    "...kdllgssldk...",
    "...kdllgswldk...",
    "....kddlddk.....",
    ".....kkddkk.....",
    ".......kk......."
  ], coinPalette),

  // Frame 6: Reverse half turn
  parseSprite([
    "......kkkk......",
    "....kkddddkk....",
    "...kdlgswgldk...",
    "..kdlgswsggldk..",
    "..kdlgswsgldk...",
    "..kdlgssssgldk..",
    "..kdlgswsggldk..",
    "...kdldddldk....",
    "....kkddddkk....",
    "......kkkk......"
  ], coinPalette),

  // Frame 7: Reverse 3/4 turn
  parseSprite([
    ".....kkkkkk.....",
    "...kkddddddkk...",
    "..kdlgswggggldk.",
    ".kdlgwswwgggldk.",
    ".kdlgsssssggldk.",
    ".kdlgwswwgggldk.",
    ".kdlgswgggggldk.",
    "..kdldddddddk...",
    "...kkddddddkk...",
    ".....kkkkkk....."
  ], coinPalette)
];

// Mascots Pixel Art Definitions (32x32 pixel sprites)

// 1. NEON NINJA (Action)
const ninjaPalette = {
  'k': '#0d1117', // dark outline
  'b': '#161b22', // suit dark
  'g': '#30363d', // suit mid
  'c': '#00f0ff', // neon cyan visor / energy blade
  'C': '#70ffff', // cyan highlight
  'm': '#ff2a85', // magenta scarf
  'M': '#ff70b0', // magenta highlight
  'w': '#ffffff', // white glare
  's': '#e09870', // skin / eyes
  'd': '#8b949e'  // silver metal
};

const ninjaSprite = parseSprite([
  "................................",
  "............kkkkkk..............",
  "..........kkbbbbbbkk............",
  ".........kbbbbbbbbbbk...........",
  "........kbbbbbbbbbbbbk..........",
  ".......kbbbbbccccbbbbk..........",
  ".......kbbbbCCCCCCbbbk..mmmM....",
  ".......kbbbbCwCwCCbbbk.mmMMMM...",
  ".......kbbbbCCCCCCbbbk.mMmMmMm..",
  "........kbbbbbbbbbbbk.mMmmMMMm..",
  "........kbbbbbbbbbbk..mMMmmm....",
  ".........kggggggggk...mmM.......",
  "........kbbbbbbbbbbk.mm.........",
  ".......kbbgccccccgbbk...........",
  "......kbbgccccccccgbbk..d.......",
  ".....kbbgCccccccccCgbbkdCd......",
  "....kbbbggCccccccCggbbkdCd......",
  "....kbbk...gggggg...kbbkdCd.....",
  "....kkb....bbbbbb....bkkdCd.....",
  "....kbb....bbbbbb....bbkdCd.....",
  ".....kk....bbbbbb....kk.dCd.....",
  "...........gggggg.......dCd.....",
  "..........kbbbbbbk......dCd.....",
  "..........kbb..bbk......dCd.....",
  "..........kbb..bbk......dCd.....",
  "..........kcc..cck......dCd.....",
  ".........kCcc..ccCk.....dCd.....",
  ".........kCCC..CCCk.....dCd.....",
  "..........kkk..kkk.......d......",
  "................................"
], ninjaPalette);

// 2. VELOCITY RACER (Racing)
const racerPalette = {
  'k': '#0f141c',
  'r': '#ff3366', // red/pink helmet
  'R': '#ff7396',
  'y': '#ffd200', // gold visor
  'Y': '#fff066',
  'w': '#ffffff', // white decals / suit
  'c': '#00d2ff', // cyan suit trims
  'b': '#1b2434', // suit navy
  'g': '#607088'  // grey
};

const racerSprite = parseSprite([
  "................................",
  "...........kkkkkkkk.............",
  ".........kkrrRRRRrrkk...........",
  "........krrRRRRRRRRrrk..........",
  ".......krrRRRRRRRRRRrrk.........",
  "......krrRRRyyyyyyyyRrrk........",
  "......krrRRyYYYYYYyyRrrk........",
  "......krrRRyYYwYYYyyRrrk........",
  "......krrRRyyyyyyyyyRrrk........",
  "......krrrRRRRRRRRRRrrrk........",
  ".......krrrrrrrrrrrrrrk.........",
  "........kkkwwwwwwwwkkk..........",
  ".......kbwbwwwwwwwwbwbk.........",
  "......kbbwbwwccccwwbwbbk........",
  ".....kbbbwbwwccccwwbwbbbk.......",
  "....kbbbbwbwwwwwwwwbwbbbbk......",
  "...kbbbbbwbwwrrrrwwbwbbbbbk.....",
  "...kbbbbbwbwwrrrrwwbwbbbbbk.....",
  "...kbbbb..kwwwwwwwwk..bbbbk.....",
  "...kbbk...kbbbbbbbbk...kbbk.....",
  "...kkk....kbbbbbbbbk....kkk.....",
  "..........kbbbbbbbbk............",
  "..........kbbbbbbbbk............",
  "..........kbbk..kbbk............",
  "..........kbbk..kbbk............",
  "..........krrk..krrk............",
  "..........krrk..krrk............",
  ".........krrrkkkrrrk............",
  ".........kkkkkkkkkkk............",
  "................................"
], racerPalette);

// 3. PIXEL STRIKER (Sports)
const strikerPalette = {
  'k': '#10141e',
  's': '#f5b584', // skin
  'S': '#ffd8b3', // skin highlight
  'h': '#4a2511', // hair brown
  't': '#00e575', // green jersey
  'T': '#66ffaa',
  'w': '#ffffff', // white shorts / ball
  'b': '#1c2638', // ball black hexagon
  'g': '#ffb020'  // gold boots
};

const strikerSprite = parseSprite([
  "................................",
  "...........kkhhhhk..............",
  "..........khhhhhhhk.............",
  "..........khhssssshk............",
  "..........khhssssshk............",
  "...........ksssssssk............",
  "...........ksskksssk............",
  "............ksssssk.............",
  "........kkkkktttttkkkkk.........",
  ".......ktttttTTTTTtttttk........",
  "......ktsttttTT1TTttttktsk......",
  ".....ksttstttTT1TTttttsttsk.....",
  "....kss...tttTTTTTttt...ssk.....",
  "....ksk...ktttttttk.....ksk.....",
  "..........kwwwwwwwk.............",
  ".........kwwkwwwkwwk............",
  ".........kwwkwwwkwwk............",
  ".........kwwk...kwwk............",
  ".........kssk...kssk............",
  ".........kssk...kssk............",
  ".........kttk...kttk............",
  ".........kttk...kttk............",
  ".........kggk...kggk............",
  "........kgggkk.kgggkk...........",
  "........kkkkkk.kkkkkk...........",
  "......................kkwwkk....",
  ".....................kwwbbwwk...",
  ".....................kwbbbbwk...",
  ".....................kwwbbwwk...",
  "......................kkwwkk...."
], strikerPalette);

// 4. ORBITAL MECH (Strategy)
const mechPalette = {
  'k': '#0d131f',
  'a': '#2b3a55', // armor blue-grey
  'A': '#4e6288', // armor light
  'c': '#00f0ff', // energy cyan
  'C': '#80f8ff',
  'o': '#ff6b2b', // orange glow / missile
  'O': '#ffa35c',
  'g': '#8899aa', // metal joint
  'w': '#ffffff'
};

const mechSprite = parseSprite([
  "................................",
  ".........koook....koook.........",
  ".........kOOOk....kOOOk.........",
  ".......kkkaAAkkkkkkAAakkk.......",
  "......kaaaAAAAAAAAAAAAaaak......",
  ".....kaaaaAAAcccCAAaaaak........",
  "....kaaaaaAAACwwCAAaaaak........",
  "...kgaaaaaAAAcccCAAaaaakg.......",
  "..kggaaaaaAAAAAAAAAAAAaagk......",
  "..kggaakkkaaaaaaaaaakkkaagk.....",
  "..kgggkaAAkaaaaaaaakaAAkggk.....",
  "..kggk.kAAkaaccaaakaAAk.kggk....",
  "..kggk..kAkacCCCacakAk..kggk....",
  "..kggk..kAkaccCcccakAk..kggk....",
  "..kggk...kkkaaaaaakkk...kggk....",
  "..kcck.....kgaaagk......kcck....",
  "..kCCk....kaAAAAAAak....kCCk....",
  "..kcck...kaAAccccAAak...kcck....",
  "...kk....kaAAk..kaAAak...kk.....",
  "........kaAAk....kaAAak.........",
  "........kaAAk....kaAAak.........",
  ".......kgaagk....kgaagk.........",
  ".......kaAAak....kaAAak.........",
  "......kaAAAAk....kaAAAAk........",
  "......kcccccck...kcccccck.......",
  ".....kcccccccck.kcccccccck......",
  ".....kkkkkkkkkk.kkkkkkkkkk......",
  "................................"
], mechPalette);

// 5. QUANTUM ALCHEMIST (Puzzle)
const alchemistPalette = {
  'k': '#120f24',
  'p': '#532b88', // robe purple
  'P': '#7b43c6',
  'm': '#e040fb', // magic magenta
  'c': '#00e5ff', // magic cyan
  'y': '#ffd600', // gold rune
  's': '#fcd2b5', // skin
  'w': '#ffffff', // beard / magic star
  'g': '#2de2b6'  // elixir flask
};

const alchemistSprite = parseSprite([
  "................................",
  "..............kk................",
  ".............kppk...............",
  "............kppppk..............",
  "...........kppPPppk.............",
  "..........kppPPPppk.............",
  "..........kppPPyppk.............",
  ".........kppppyyyppk............",
  "........kppppkssyppk............",
  ".......kppPPksssskppk...........",
  ".......kppPksswwsskkk...........",
  "........kkkswwwwwwk..mm.........",
  ".......kpppwwwwwwwwkmmmm........",
  "......kppPPkswwwwwk.mmmm........",
  ".....kppPkkkwwwwwk..mm..........",
  "....kpppPkppkwwwk...............",
  "...kppppPkppkwwk..kggk..........",
  "...kppPPPkppkkk..kggggk.........",
  "...kpPPyPkppppk.kggggggk........",
  "...kppPyPkppppkkggggggggk.......",
  "....kpppPkppppkkggccccggk.......",
  "....kppppkppppkkggccccggk.......",
  ".....kpppkpppk..kkkggkkk........",
  ".....kpppkpppk..................",
  "....kppppkppppk.................",
  "...kppPPpkppPPpk................",
  "...kkkkkkkkkkkkk................",
  "................................"
], alchemistPalette);

// 6. PIXEL KING (Tabletop)
const kingPalette = {
  'k': '#18121a',
  'r': '#851d3b', // royal burgundy
  'R': '#bf305a',
  'y': '#ffc000', // royal gold crown
  'Y': '#ffe066',
  'w': '#ffffff', // ermine white
  'b': '#2b223a', // dark fur spots
  's': '#f3ba93', // skin
  'd': '#3dc6ff'  // gem sapphire
};

const kingSprite = parseSprite([
  "................................",
  ".........kkykkykkyk.............",
  ".........kyYkyYkyYk.............",
  ".........kyYdkyYdYk.............",
  ".........kyYYYYYYYk.............",
  "..........kyyyyyyk..............",
  "..........kssssssk..............",
  "..........ksksksksk.............",
  "..........kssssssk..............",
  "..........kswwswsk..............",
  "...........kwwwwk...............",
  "........kkkkwwwwkkkk............",
  ".......krRRkwwwwkRRrk...........",
  "......krRRRkwwwwkRRRrk...y......",
  ".....krRRRkkwwwwkkRRRrk.yYy.....",
  "....krRRRkwbwbwbwkkRRrkkyYyk....",
  "....krRRkwbwbwbwbwkRRrkkYYyk....",
  "....krRkkwbwbwbwbwkkRrkkyyk.....",
  "....krRkkwbwbwbwbwkkRrk.kk......",
  "....krRk.kwwwwwwwwk.kRrk........",
  "....kkk..krrrrrrrrk..kkk........",
  ".........krrrrrrrrk.............",
  ".........krrrrrrrrk.............",
  ".........krrrrrrrrk.............",
  ".........kwwwwwwwwk.............",
  "........kwbwbwbwbwbk............",
  "........kkkkkkkkkkkk............",
  "................................"
], kingPalette);

// 7. BEAT MASTER (Timing)
const djPalette = {
  'k': '#0c101c',
  'c': '#00f0ff', // cyan headphones / synth
  'C': '#80f8ff',
  'm': '#ff1b8d', // magenta equalizer
  'M': '#ff7ec2',
  's': '#e09872', // skin
  'h': '#ffbb00', // cap / visor
  'b': '#1f293d', // jacket
  'w': '#ffffff'  // white accents
};

const djSprite = parseSprite([
  "................................",
  "..........kkkkkkkk..............",
  ".........khhhhhhhhk.............",
  "........khhhhhhhhhhk............",
  ".......kccchhhhhhccck...........",
  "......kccccksssskcccck..........",
  "......kcCccksmmskcCcck..........",
  "......kccccksssskcccck..........",
  ".......kcccksssskccck...........",
  "........kkkksssskkkk............",
  "........kbbksssskbbk............",
  ".......kbbbbksskkbbbk...........",
  "......kbbbbbbkkbbbbbbk..........",
  ".....kbbbbbbbbbbbbbbbbk.........",
  "....kbbbbmMbbbbbbMmb..bk........",
  "....kbbbbMMbbbbbbMMb...k........",
  "....kbbb..kbbbbbbk..k..k........",
  "....kbk...kbbbbbbk...k.k........",
  "..........kbbbbbbk....kk........",
  "..........kcccccck..............",
  "..........kcccccck..............",
  ".........kkwwwwwwkk.............",
  "........kck......kck............",
  ".......kcck......kcck...........",
  ".......kcck......kcck...........",
  "......kcccck....kcccck..........",
  "......kkkkkk....kkkkkk..........",
  "................................"
], djPalette);

// 8. SWEET HOPPER (Original Candy Drop)
const hopperPalette = {
  'k': '#1a0c1e',
  'p': '#ff4088', // sweet pink
  'P': '#ff7db3', // pink highlight
  'w': '#ffffff', // white glare / eyes
  'b': '#120516', // pupil
  'y': '#ffd200', // gold star candy
  'c': '#00e5ff', // cyan swirl
  'g': '#00e676'  // green gumdrop
};

const hopperSprite = parseSprite([
  "................................",
  "............kkk.................",
  "...........kpppk................",
  "...........kpppk................",
  "..........kppPppk...............",
  ".........kppPPPppk..............",
  "........kppPPcPPppk.............",
  ".......kppPPccCPPppk............",
  "......kppPPcccccPPppk...........",
  ".....kppPPccCwcPPpppk..........",
  "....kppPPccccwcCPppppk..........",
  "...kppPPccCwwkkwcCPpppk.........",
  "...kpPPccCwwkbbkwcCPppk.........",
  "...kpPPccCwwkbbkwcCPppk.........",
  "...kpPPccCwwkkwkkwcCPppk........",
  "...kpPPccCwwk..kwcCPppk.........",
  "...kpPPccCcc...kwcCPppk.........",
  "...kpPPccCcc...kwcCPppk.........",
  "...kppPPccCcccccCPpppk..........",
  "....kppPPccCCCccPPppk...kyyk....",
  ".....kppPPcccccPPppk...kyyyyk...",
  "......kpppPPPPPpppk...kyyyyyk...",
  ".......kpppppppppk.....kyyyk....",
  "........kkkppppkkk......kkk.....",
  ".........kpp..ppk...............",
  "........kppp..pppk..............",
  "........kPPk..kPPk..............",
  "........kkkk..kkkk..............",
  "................................"
], hopperPalette);

module.exports = {
  parseSprite,
  coinFrames,
  coinPalette,
  ninjaSprite,
  ninjaPalette,
  racerSprite,
  racerPalette,
  strikerSprite,
  strikerPalette,
  mechSprite,
  mechPalette,
  alchemistSprite,
  alchemistPalette,
  kingSprite,
  kingPalette,
  djSprite,
  djPalette,
  hopperSprite,
  hopperPalette
};
