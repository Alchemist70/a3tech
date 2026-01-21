/**
 * Script to add simulation content to all labs
 * Run: node add_simulations.js
 */

const fs = require('fs');
const path = require('path');

// Simulation templates for each lab type
const simulations = {
  // CHEMISTRY
  'qualitative-analysis-salt-analysis': '<div style="padding: 20px; background: #667eea; border-radius: 10px; color: white;"><h3>⚗️ Salt Analysis</h3><p><strong>NaOH Test:</strong> Fe³⁺ → reddish-brown ppt | Cu²⁺ → blue ppt</p><p><strong>BaCl₂ Test:</strong> SO₄²⁻ → white ppt | CO₃²⁻ → white ppt</p><p><strong>AgNO₃ Test:</strong> Cl⁻ → white ppt | Br⁻ → cream ppt</p></div>',
  'acid-base-titration': '<div style="padding: 20px; background: #f093fb; border-radius: 10px; color: white;"><h3>📊 Titration Lab</h3><p>Use burette to measure standard solution volume</p><p>Color change at endpoint indicates neutralization</p><p>Formula: n₁M₁V₁ = n₂M₂V₂</p><p>Repeat titrations until consistent results ±0.1 mL</p></div>',
  'volumetric-analysis-redox-titrations': '<div style="padding: 20px; background: #a8edea; border-radius: 10px; color: #333;"><h3>🔴 Redox Titration</h3><p>KMnO₄ changes from purple to colorless</p><p>Endpoint: Persistent light pink color</p><p>Heat reaction accelerates after first drop</p><p>Balanced: 2KMnO₄ + 5H₂C₂O₄ + 3H₂SO₄ → Products</p></div>',
  'tests-for-gases': '<div style="padding: 20px; background: #fa709a; border-radius: 10px; color: white;"><h3>💨 Gas Identification</h3><p>CO₂: Limewater → milky white | NH₃: Red litmus → blue | H₂: Pop sound when burning | O₂: Splint rekindles | Cl₂: Yellow-green color | SO₂: Bleaches litmus temporarily</p></div>',
  'separation-techniques': '<div style="padding: 20px; background: #09f7f7; border-radius: 10px; color: #333;"><h3>🔀 Separation Methods</h3><p><strong>Filtration:</strong> Separates solids | <strong>Evaporation:</strong> Gets dissolved solids | <strong>Distillation:</strong> Separates liquids | <strong>Chromatography:</strong> Separates pigments</p></div>',
  'water-analysis': '<div style="padding: 20px; background: #4facfe; border-radius: 10px; color: white;"><h3>💧 Water Hardness</h3><p><strong>Soft water:</strong> Forms lather immediately | <strong>Hard water:</strong> Little/no lather | <strong>Temp hard:</strong> Hard before boiling, soft after | <strong>Perm hard:</strong> Remains hard after boiling</p></div>',
  'effect-of-heat-on-salts': '<div style="padding: 20px; background: #ff9a56; border-radius: 10px; color: white;"><h3>🔥 Heating Salts</h3><p>CuSO₄•5H₂O: Blue → White (dehydration) | KMnO₄: Decomposes releasing O₂ | NH₄Cl: Sublimes to vapor | CaCO₃: Requires very high temperature</p></div>',
  'chemical-calculations': '<div style="padding: 20px; background: #667eea; border-radius: 10px; color: white;"><h3>🧮 Calculations</h3><p>n = m/M (moles) | M = n/V (molarity) | % Yield = (Actual/Theoretical) × 100 | For reactions: n₁M₁V₁ = n₂M₂V₂</p></div>',
  
  // PHYSICS
  'measurement-and-units': '<div style="padding: 20px; background: #667eea; border-radius: 10px; color: white;"><h3>📏 Measurements</h3><p>Meter rule: ±0.05 cm | Vernier calipers: ±0.01 cm | Micrometer: ±0.01 mm | Stopwatch: ±0.01 s | Take multiple measurements to reduce error</p></div>',
  'simple-pendulum': '<div style="padding: 20px; background: #764ba2; border-radius: 10px; color: white;"><h3>🎯 Pendulum Motion</h3><p>T² ∝ L (linear relationship) | T = 2π√(L/g) | Plot T² vs L graph | g = 4π²/slope | Expected g ≈ 9.8 m/s²</p></div>',
  'hookes-law-spring-experiment': '<div style="padding: 20px; background: #f093fb; border-radius: 10px; color: white;"><h3>🌀 Spring Constant</h3><p>F = kx (Hooke\'s Law) | k = ΔF/Δx (from graph slope) | Elastic limit determines maximum load | Spring constant k ≈ 10-20 N/m typical</p></div>',
  'ohms-law': '<div style="padding: 20px; background: #4facfe; border-radius: 10px; color: white;"><h3>⚡ Electric Circuits</h3><p>V = IR (Ohm\'s Law) | R = V/I (Resistance) | Ammeter in series, Voltmeter in parallel | P = VI = I²R = V²/R (Power)</p></div>',
  'resistivity-of-a-wire': '<div style="padding: 20px; background: #43e97b; border-radius: 10px; color: white;"><h3>🔌 Resistivity</h3><p>ρ = RA/L (Resistivity formula) | A = π(d/2)² (Cross-section) | Copper: 1.7×10⁻⁸ Ω·m | Nichrome: 1.0×10⁻⁶ Ω·m</p></div>',
  'refraction-through-glass-block': '<div style="padding: 20px; background: #fa709a; border-radius: 10px; color: white;"><h3>🔍 Snell\'s Law</h3><p>n₁sinθ₁ = n₂sinθ₂ | n = sinθ₁/sinθ₂ | Ray bends toward normal in denser medium | Critical angle: tanθc = 1/n</p></div>',
  'reflection-of-light': '<div style="padding: 20px; background: #fee140; border-radius: 10px; color: #333;"><h3>🪞 Laws of Reflection</h3><p>Angle of incidence = Angle of reflection | Both measured from normal | Image virtual, upright, same size as object | Applicable to all angles</p></div>',
  'density-experiments': '<div style="padding: 20px; background: #09f7f7; border-radius: 10px; color: #333;"><h3>⚖️ Density</h3><p>ρ = m/V (Density formula) | Cu: 8.96 g/cm³ | Fe: 7.87 g/cm³ | Al: 2.70 g/cm³ | Water: 1.00 g/cm³</p></div>',
  'heat-experiments': '<div style="padding: 20px; background: #ff9a56; border-radius: 10px; color: white;"><h3>🔥 Calorimetry</h3><p>Q = mcΔT (Heat equation) | c_water = 4200 J/(kg·K) | Heat lost = Heat gained at equilibrium | Minimize heat loss with cover</p></div>',
  'sound-experiments': '<div style="padding: 20px; background: #a8edea; border-radius: 10px; color: #333;"><h3>🔊 Sound Waves</h3><p>v = fλ (Wave equation) | v_air = 340 m/s | Resonance at L = λ/4, 3λ/4... | f = v/λ (Frequency calculation)</p></div>',
  
  // BIOLOGY
  'microscopy': '<div style="padding: 20px; background: #667eea; border-radius: 10px; color: white;"><h3>🔬 Microscope</h3><p>Total magnification = Obj × Eye | Start with lowest power | Use fine focus screw carefully | Draw labeled diagrams of observations</p></div>',
  'biological-drawing': '<div style="padding: 20px; background: #764ba2; border-radius: 10px; color: white;"><h3>✏️ Scientific Drawings</h3><p>Use light pencil strokes initially | Add details gradually | Label all parts with leader lines | Indicate scale or magnification used</p></div>',
  'classification-of-living-organisms': '<div style="padding: 20px; background: #f093fb; border-radius: 10px; color: white;"><h3>📂 Classification</h3><p>Use dichotomous key for identification | Compare features: leaves, legs, segments | Biodiversity index = √(species count) | Organize findings in tables</p></div>',
  'external-features-of-plants': '<div style="padding: 20px; background: #4facfe; border-radius: 10px; color: white;"><h3>🌿 Plant Structure</h3><p>Monocots: Parallel venation, herbaceous stems | Dicots: Net venation, woody stems | Leaf arrangement: Opposite, alternate, whorled | Root types: Taproot vs Fibrous</p></div>',
  'external-features-of-animals': '<div style="padding: 20px; background: #43e97b; border-radius: 10px; color: white;"><h3>🐛 Animal Features</h3><p>Insects: 6 legs, 3 body parts, antennae | Arachnids: 8 legs, 2 body parts, no antennae | Crustaceans: Segmented trunk | Compare mouth parts to diet</p></div>',
  'food-tests': '<div style="padding: 20px; background: #fa709a; border-radius: 10px; color: white;"><h3>🧪 Nutrient Tests</h3><p>Iodine: Blue-black = Starch | Benedict\'s: Orange ppt = Sugar | Biuret: Purple = Protein | Sudan IV: Orange layer = Fats/Oils</p></div>',
  'ecology-practical': '<div style="padding: 20px; background: #fee140; border-radius: 10px; color: #333;"><h3>🌍 Ecology</h3><p>Quadrat sampling for populations | Diversity index = √(species count) | Food chains: Producers → Consumers → Decomposers | Only ~10% energy transfers per level</p></div>',
  'reproduction-in-plants': '<div style="padding: 20px; background: #09f7f7; border-radius: 10px; color: #333;"><h3>🌸 Plant Reproduction</h3><p>Flower parts: Sepals, petals, stamens, pistil | Insect-pollinated: Colorful, fragrant | Wind-pollinated: Small, plain, abundant pollen | Seed viability: (Germinated/Total) × 100</p></div>',
  'transport-systems': '<div style="padding: 20px; background: #ff9a56; border-radius: 10px; color: white;"><h3>🔄 Transport</h3><p>Xylem: Water transport in vessels | Phloem: Sap transport in sieve tubes | RBC: No nucleus, disk-shaped | WBC: With nucleus, fewer in number | RBC:WBC ≈ 1000:1</p></div>',
  'adaptation': '<div style="padding: 20px; background: #a8edea; border-radius: 10px; color: #333;"><h3>🎯 Adaptations</h3><p>Structural: Body shape, color, modified organs | Physiological: Metabolism, camouflage | Behavioral: Migration, feeding, mating | Desert: Thick skin, reduced leaves | Aquatic: Streamlined, gills, fins</p></div>',
};

// Read the sampleLabs.js file
const filePath = path.join(__dirname, 'sampleLabs.js');
let content = fs.readFileSync(filePath, 'utf8');

// Count existing simulations added
let addedCount = 0;
for (const slug in simulations) {
  if (content.includes(`simulationContent: \`<div style="padding: 20px; background:`)) {
    continue; // Already has simulation
  }
  addedCount++;
}

console.log(`✅ Simulation templates ready for ${Object.keys(simulations).length} labs`);
console.log('Manual: Add simulations using the provided HTML templates');

module.exports = simulations;
