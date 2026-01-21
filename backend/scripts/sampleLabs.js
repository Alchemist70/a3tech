/**
 * Sample Lab Practicals Data
 * This file contains sample data for all Chemistry, Physics, and Biology practicals
 * Can be imported into the database for quick setup
 */

const sampleLabs = [
  // ==================== CHEMISTRY PRACTICALS ====================
  {
    subject: 'Chemistry',
    title: '1. Qualitative Analysis (Salt Analysis)',
    slug: 'qualitative-analysis-salt-analysis',
    description: 'Identification of anions and cations in unknown substances using reagents like NaOH, NH₃, BaCl₂, AgNO₃. Candidates observe colour changes, precipitates, solubility, and gases evolved.',
    order: 1,
    objectives: [
      'Identify anions and cations in unknown salt solutions',
      'Understand the concept of qualitative analysis',
      'Learn to use various reagents and observe their reactions',
      'Record and interpret observations systematically'
    ],
    materials: [
      'Unknown salt solution',
      'NaOH solution',
      'NH₃ solution',
      'BaCl₂ solution',
      'AgNO₃ solution',
      'HCl and H₂SO₄',
      'Test tubes',
      'Test tube rack',
      'Pipettes',
      'Bunsen burner'
    ],
    procedure: `1. Take a small portion of the unknown salt solution in a test tube
2. Add NaOH solution drop by drop and observe color change
3. If precipitate forms, test if it dissolves in excess NaOH
4. Repeat with NH₃ solution
5. Test for anions using BaCl₂ (for carbonate/sulfate) and AgNO₃ (for chloride/bromide)
6. Record all observations
7. Identify the cation and anion based on observations`,
    precautions: [
      'Wear safety goggles at all times',
      'Handle chemicals carefully',
      'Use small quantities of solutions',
      'Avoid contact with skin and eyes',
      'Ensure proper ventilation',
      'Dispose of chemical waste properly'
    ],
    observations: `Observations depend on the unknown salt:
- NaOH: May form colored precipitate or colorless precipitate
- NH₃: May form precipitate or colored complex
- BaCl₂: White precipitate indicates SO₄²⁻ or CO₃²⁻
- AgNO₃: White, cream, or yellow precipitate indicates halides
- Color changes indicate transition metal ions`,
    calculations: `Based on the observations and known reactions:
- Fe³⁺ + 3NaOH → Fe(OH)₃ (reddish-brown ppt)
- Cu²⁺ + 2NaOH → Cu(OH)₂ (blue ppt)
- Ba²⁺ + SO₄²⁻ → BaSO₄ (white ppt)
- Ag⁺ + Cl⁻ → AgCl (white ppt)`,
    simulationContent: `
<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; color: white; font-family: Arial, sans-serif;">
  <h3 style="margin-top: 0; text-align: center;">⚗️ Salt Analysis Simulation</h3>
  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p><strong>Select Unknown Salt:</strong></p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
      <button onclick="simulateReaction('FeSO4')" style="padding: 10px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">FeSO₄</button>
      <button onclick="simulateReaction('CuSO4')" style="padding: 10px; background: #4ecdc4; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">CuSO₄</button>
      <button onclick="simulateReaction('BaCl2')" style="padding: 10px; background: #ffe66d; color: #333; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">BaCl₂</button>
      <button onclick="simulateReaction('AgNO3')" style="padding: 10px; background: #c7ceea; color: #333; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">AgNO₃</button>
    </div>
  </div>
  <div id="result" style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; min-height: 100px; margin: 10px 0;">
    <p style="text-align: center; color: #ddd;">Click a salt to see reactions with reagents</p>
  </div>
  <script>
    function simulateReaction(salt) {
      const reactions = {
        FeSO4: '<strong>FeSO₄ (Iron II Sulfate)</strong><br>🧪 With NaOH: Light green ppt → Reddish-brown (oxidation)<br>🧪 With NH₃: Light green ppt → Reddish-brown<br>🧪 With BaCl₂: White ppt (SO₄²⁻)<br>🧪 With AgNO₃: No ppt',
        CuSO4: '<strong>CuSO₄ (Copper II Sulfate)</strong><br>🧪 With NaOH: Blue ppt (Cu(OH)₂)<br>🧪 With NH₃: Blue ppt → Deep blue complex<br>🧪 With BaCl₂: White ppt (SO₄²⁻)<br>🧪 With AgNO₃: No ppt',
        BaCl2: '<strong>BaCl₂ (Barium Chloride)</strong><br>🧪 With NaOH: White ppt (Ba(OH)₂)<br>🧪 With NH₃: No ppt<br>🧪 With H₂SO₄: White ppt (BaSO₄)<br>🧪 With AgNO₃: White ppt (AgCl)',
        AgNO3: '<strong>AgNO₃ (Silver Nitrate)</strong><br>🧪 With NaOH: Dark brown Ag₂O ppt<br>🧪 With NH₃: White ppt → Soluble in excess<br>🧪 With HCl: White ppt (AgCl)<br>🧪 With Fe: Mirror surface forms'
      };
      document.getElementById('result').innerHTML = reactions[salt];
    }
  </script>
</div>
    `,
  },
  {
    subject: 'Chemistry',
    title: '2. Acid-Base Titration',
    slug: 'acid-base-titration',
    description: 'Determining the concentration of an acid or base using a standard solution and an indicator (methyl orange, phenolphthalein). Involves burette, pipette, and calculation of molarity.',
    order: 2,
    objectives: [
      'Perform accurate titration of acid and base',
      'Determine unknown concentration using titration',
      'Learn to use burette and pipette correctly',
      'Understand titration curves and indicators'
    ],
    materials: [
      'Burette (50 mL)',
      'Pipette (20 mL or 25 mL)',
      'Conical flask',
      'Beaker',
      'Standard solution (HCl or NaOH)',
      'Unknown solution',
      'Methyl orange or phenolphthalein indicator',
      'Funnel',
      'Burette stand',
      'Distilled water'
    ],
    procedure: `1. Fill burette with standard solution using funnel
2. Note initial reading (0 mL or close to it)
3. Pipette 20 mL of unknown solution into conical flask
4. Add 2-3 drops of indicator
5. Titrate by adding standard solution from burette
6. Stop when color changes (endpoint)
7. Note final reading
8. Calculate volume of standard solution used
9. Repeat 3-5 times until consistent results obtained`,
    precautions: [
      'Handle burette carefully to avoid damage',
      'Ensure burette tap doesn\'t leak',
      'Use funnel when filling burette',
      'Pipette must be clean and dry',
      'Always use safety bulb with pipette',
      'Avoid parallax error when reading measurements'
    ],
    observations: `The color change indicates the endpoint:
- For HCl vs NaOH with methyl orange: red to yellow
- For HCl vs NaOH with phenolphthalein: colorless to pink
- Volume used should be consistent across trials (±0.1 mL)`,
    calculations: `For neutralization reaction: n₁M₁V₁ = n₂M₂V₂
Where:
- n = number of H⁺ or OH⁻ ions
- M = molarity
- V = volume in mL

Example: If 25 mL of 0.1 M HCl requires 20 mL of NaOH:
0.1 × 25 × 1 = M × 20 × 1
M of NaOH = 0.125 M`,
    simulationContent: `
<div style="padding: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 10px; color: white; font-family: Arial, sans-serif;">
  <h3 style="margin-top: 0; text-align: center;">📊 Titration Simulator</h3>
  <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p><strong>Burette Reading (mL):</strong> <span id="burette" style="font-weight: bold; font-size: 1.2em;">0.0</span></p>
    <input type="range" min="0" max="25" step="0.5" value="0" onchange="updateBurette(this.value)" style="width: 100%; cursor: pointer;"/>
    <p style="margin-top: 15px;"><strong>Flask Color: </strong><span id="color" style="padding: 5px 15px; background: #ffcccc; border-radius: 5px; font-weight: bold;">Light Red</span></p>
    <div id="endpoint" style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center;"></div>
  </div>
  <script>
    function updateBurette(val) {
      document.getElementById('burette').textContent = val + '.0';
      const volume = parseFloat(val);
      if (volume < 10) {
        document.getElementById('color').textContent = 'Light Red';
        document.getElementById('color').style.background = '#ffcccc';
        document.getElementById('endpoint').innerHTML = '🔴 Titration in progress...';
      } else if (volume < 15) {
        document.getElementById('color').textContent = 'Medium Red';
        document.getElementById('color').style.background = '#ff9999';
        document.getElementById('endpoint').innerHTML = '🟠 Approaching endpoint...';
      } else if (volume < 20) {
        document.getElementById('color').textContent = 'Pale Pink';
        document.getElementById('color').style.background = '#ffdddd';
        document.getElementById('endpoint').innerHTML = '🟡 Very close to endpoint...';
      } else {
        document.getElementById('color').textContent = 'Colorless + Pink';
        document.getElementById('color').style.background = '#ffffff';
        document.getElementById('endpoint').innerHTML = '✅ <strong>ENDPOINT REACHED!</strong><br>Volume used: ' + val + '.0 mL<br>Calculate concentration using n₁M₁V₁ = n₂M₂V₂';
      }
    }
  </script>
</div>
    `,
  },
  {
    subject: 'Chemistry',
    title: '3. Volumetric Analysis (Redox/Other Titrations)',
    slug: 'volumetric-analysis-redox-titrations',
    description: 'Titrations involving oxidation-reduction reactions (e.g., KMnO₄ vs oxalic acid). Focus on accurate readings and correct calculations.',
    order: 3,
    objectives: [
      'Understand redox titrations',
      'Perform KMnO₄ titration accurately',
      'Learn electron transfer in redox reactions',
      'Calculate oxidation and reduction states'
    ],
    materials: [
      'KMnO₄ solution (approximately 0.05 M)',
      'Oxalic acid solution',
      'Burette (50 mL)',
      'Pipette (20 mL)',
      'Conical flask',
      'Beaker',
      'Thermometer',
      'Burette stand'
    ],
    procedure: `1. Fill burette with KMnO₄ solution
2. Note initial reading
3. Pipette 20 mL of oxalic acid solution into flask
4. Add KMnO₄ drop by drop from burette
5. Light purple/pink color indicates slight excess
6. Note final reading when endpoint reached
7. Calculate volume used
8. Repeat at least 3 times`,
    precautions: [
      'KMnO₄ is a strong oxidizing agent',
      'Avoid contact with skin',
      'Use in well-ventilated area',
      'Do not pipette KMnO₄ by mouth',
      'Heat may be needed to start reaction',
      'Once first drop of KMnO₄ is added, rate of reaction increases'
    ],
    observations: `The purple color of KMnO₄:
- Disappears as it oxidizes oxalic acid
- First drop may take longer to decolorize (warming of flask)
- After temperature rises, decolorization is instantaneous
- Pink color persists when excess KMnO₄ is added`,
    calculations: `KMnO₄ + H₂C₂O₄ → Mn²⁺ + CO₂ + H₂O
Balanced: 2KMnO₄ + 5H₂C₂O₄ + 3H₂SO₄ → K₂SO₄ + 2MnSO₄ + 10CO₂ + 8H₂O
Using: n₁M₁V₁ = n₂M₂V₂
2 × M(KMnO₄) × V(KMnO₄) = 5 × M(oxalic acid) × 20`,
    simulationContent: `
<div style="padding: 20px; background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 10px; color: #333; font-family: Arial, sans-serif;">
  <h3 style="margin-top: 0; text-align: center;">🔴 Redox Titration (KMnO₄ vs Oxalic Acid)</h3>
  <div style="background: rgba(255,255,255,0.3); padding: 15px; border-radius: 8px; margin: 15px 0;">
    <p><strong>Burette Progress:</strong></p>
    <input type="range" min="0" max="20" step="1" value="0" onchange="updateRedox(this.value)" style="width: 100%; cursor: pointer;"/>
    <p style="text-align: center; margin: 15px 0;"><span id="redox-vol" style="font-size: 1.3em; font-weight: bold;">0 mL</span></p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0;">
      <div style="background: rgba(200, 100, 100, 0.5); padding: 10px; border-radius: 5px; text-align: center;">
        <p style="margin: 0;"><strong>Oxalic Acid</strong></p>
        <p style="margin: 0; font-size: 0.9em;">Colorless</p>
      </div>
      <div id="kmno4-color" style="background: rgba(150, 50, 50, 0.7); padding: 10px; border-radius: 5px; text-align: center;">
        <p style="margin: 0;"><strong>KMnO₄</strong></p>
        <p style="margin: 0; font-size: 0.9em;" id="kmno4-text">Dark Purple</p>
      </div>
    </div>
    <div id="redox-result" style="background: rgba(100, 100, 200, 0.2); padding: 10px; border-radius: 5px; text-align: center; margin-top: 10px;">
      <p style="margin: 0; color: #666;">Reaction occurring...</p>
    </div>
  </div>
  <script>
    function updateRedox(val) {
      const v = parseInt(val);
      document.getElementById('redox-vol').textContent = v + ' mL';
      if (v === 0) {
        document.getElementById('kmno4-color').style.background = 'rgba(150, 50, 50, 0.7)';
        document.getElementById('kmno4-text').textContent = 'Dark Purple';
        document.getElementById('redox-result').innerHTML = '<p style="margin: 0;">Add KMnO₄ slowly...</p>';
      } else if (v < 15) {
        document.getElementById('kmno4-color').style.background = 'rgba(100, 150, 200, 0.5)';
        document.getElementById('kmno4-text').textContent = 'Decolorizing';
        document.getElementById('redox-result').innerHTML = '<p style="margin: 0;">🔥 Reaction accelerating (solution heating)...</p>';
      } else if (v < 19) {
        document.getElementById('kmno4-color').style.background = 'rgba(100, 200, 150, 0.5)';
        document.getElementById('kmno4-text').textContent = 'Light Purple';
        document.getElementById('redox-result').innerHTML = '<p style="margin: 0;">⚠️ Nearly at endpoint...</p>';
      } else {
        document.getElementById('kmno4-color').style.background = 'rgba(255, 100, 100, 0.5)';
        document.getElementById('kmno4-text').textContent = 'Slight Pink (Excess)';
        document.getElementById('redox-result').innerHTML = '<p style="margin: 0;">✅ <strong>ENDPOINT!</strong><br>Persistent pink color = Excess KMnO₄<br>Volume used = ' + val + ' mL</p>';
      }
    }
  </script>
</div>
    `,
  },
  {
    subject: 'Chemistry',
    title: '4. Tests for Gases',
    slug: 'tests-for-gases',
    description: 'Laboratory tests for gases such as CO₂, NH₃, H₂, O₂, Cl₂, SO₂ using limewater, litmus paper, glowing splint, and other methods.',
    order: 4,
    objectives: [
      'Learn methods to identify different gases',
      'Understand the chemical reactions that produce gases',
      'Perform gas collection and testing experiments',
      'Interpret results to identify unknown gases'
    ],
    materials: [
      'Limewater',
      'Litmus paper (red and blue)',
      'Wooden splint',
      'Test tubes',
      'Delivery tubes',
      'Various chemicals for gas generation',
      'Bunsen burner',
      'Beaker with water'
    ],
    procedure: `1. CO₂ test: Generate CO₂, pass through limewater (turns milky)
2. NH₃ test: Wet red litmus paper with ammonia gas (turns blue)
3. H₂ test: Light hydrogen gas, burns with pop sound
4. O₂ test: Glowing splint relights in oxygen
5. Cl₂ test: Bleaching of damp litmus paper
6. SO₂ test: Bleaches litmus but color returns on heating`,
    precautions: [
      'Never smell gases directly',
      'Use fume hood for toxic gases',
      'Cl₂, SO₂, and NH₃ are poisonous',
      'H₂ is flammable - ignite at source',
      'Wear safety goggles',
      'Do not trap gases in closed containers'
    ],
    observations: `Gas identification characteristics:
- CO₂: Colorless, odorless, turns limewater milky
- NH₃: Pungent smell, turns red litmus blue, white smoke with HCl
- H₂: Colorless, burns with pop sound
- O₂: Colorless, rekindles glowing splint
- Cl₂: Yellow-green color, bleaches litmus permanently
- SO₂: Pungent, bleaches litmus temporarily`,
    calculations: `Gas generation equations:
CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑
NH₄Cl + Ca(OH)₂ → CaCl₂ + NH₃↑ + H₂O
Zn + 2HCl → ZnCl₂ + H₂↑`,
    simulationContent: `<div style="padding: 20px; background: #FA709A;"><h3>Gas Tests</h3><p>CO₂: Limewater milky | NH₃: Blue litmus | H₂: Pop | O₂: Splint rekindles | Cl₂: Yellow-green</p></div>`,
  },
  {
    subject: 'Chemistry',
    title: '5. Separation Techniques',
    slug: 'separation-techniques',
    description: 'Methods such as filtration, evaporation, distillation, chromatography, and decantation to separate mixtures.',
    order: 5,
    objectives: [
      'Learn different separation methods',
      'Understand when to apply each technique',
      'Perform filtration, evaporation, and distillation',
      'Separate and identify components of mixtures'
    ],
    materials: [
      'Filter paper',
      'Funnel',
      'Evaporating dish',
      'Distillation flask',
      'Condenser',
      'Thermometer',
      'Various mixtures to separate',
      'Beaker',
      'Bunsen burner',
      'Chromatography paper'
    ],
    procedure: `1. FILTRATION: Pour mixture through filter paper to separate solids
2. EVAPORATION: Heat solution in evaporating dish until dry
3. DISTILLATION: Collect vapor through condenser to get pure liquid
4. CHROMATOGRAPHY: Spot mixture on paper and develop with solvent
5. DECANTATION: Pour liquid carefully to separate from settled solid`,
    precautions: [
      'Use proper stand and clamps for heated glassware',
      'Do not overfill flasks',
      'Add boiling chips to prevent bumping',
      'Ensure condenser water flows correctly',
      'Allow hot glassware to cool before handling'
    ],
    observations: `Results depend on mixture type:
- Filtration: Residue remains on paper, filtrate passes through
- Evaporation: Solid residue left in dish
- Distillation: Liquid collects in receiver
- Chromatography: Different colored spots at different heights
- Decantation: Clear liquid separated from sediment`,
    calculations: `For evaporation: Mass of solute = Final mass - Initial mass of container
For chromatography: Rf = Distance traveled by substance / Distance traveled by solvent`,
    simulationContent: `<div style="padding: 20px; background: #09f7f7;"><h3>Separation Methods</h3><p>Filtration separates solids | Evaporation gets dissolved solids | Distillation separates liquids | Chromatography separates pigments</p></div>`,
  },
  {
    subject: 'Chemistry',
    title: '6. Water Analysis',
    slug: 'water-analysis',
    description: 'Testing water samples for hardness, pH, impurities, and methods of purification.',
    order: 6,
    objectives: [
      'Test water for hardness (temporary and permanent)',
      'Measure pH of water samples',
      'Detect impurities in water',
      'Understand water purification methods'
    ],
    materials: [
      'Water samples',
      'pH paper or pH meter',
      'Soap solution',
      'Hard water',
      'Distilled water',
      'Test tubes',
      'Beakers',
      'Lime water',
      'Conductivity meter (optional)'
    ],
    procedure: `1. pH TEST: Use pH paper or meter to determine pH
2. HARDNESS TEST: Add soap solution, count lather (hard water needs more soap)
3. TEMPORARY HARDNESS: Boil water, test again (should reduce hardness)
4. PERMANENT HARDNESS: Test after boiling (not reduced by boiling)
5. IMPURITIES: Filter water and observe residue`,
    precautions: [
      'Use clean glassware',
      'Avoid contamination of samples',
      'Handle water samples carefully',
      'Calibrate pH meter before use'
    ],
    observations: `Different water types show:
- Soft water: Lather forms immediately (1 cm)
- Hard water: Little or no lather, cloudy
- Neutral water: pH = 7
- Acidic water: pH < 7 (from rain or peat)
- Alkaline water: pH > 7 (from limestone regions)`,
    calculations: `Hardness in ppm = (Volume of soap used) × (Factor)
Temporary hardness = Ca(HCO₃)₂ and Mg(HCO₃)₂
Permanent hardness = CaSO₄, MgSO₄, etc.`,
    simulationContent: `<div style="padding: 20px; background: #4facfe; color: white;"><h3>Water Hardness Analysis</h3><p>Soft water forms lather immediately | Hard water shows little lather, cloudy | Temp hard: Hard→Soft when boiled | Perm hard: Remains hard after boiling</p></div>`,
  },
  {
    subject: 'Chemistry',
    title: '7. Effect of Heat on Salts',
    slug: 'effect-of-heat-on-salts',
    description: 'Heating salts to observe decomposition, colour change, gas evolution, and residue formation.',
    order: 7,
    objectives: [
      'Observe decomposition of various salts on heating',
      'Identify gases evolved',
      'Record color changes',
      'Understand thermal decomposition reactions'
    ],
    materials: [
      'Various salts (CuSO₄·5H₂O, KMnO₄, KClO₃, etc.)',
      'Test tube',
      'Bunsen burner',
      'Tripod stand',
      'Delivery tube',
      'Gas tests',
      'Spatula'
    ],
    procedure: `1. Take a small sample of the salt in a test tube
2. Heat gently over a Bunsen burner
3. Observe color changes
4. Note any gas evolution
5. Test evolved gases using appropriate methods
6. Continue heating until no more changes
7. Allow to cool and examine residue`,
    precautions: [
      'Use small quantities',
      'Heat gently to avoid explosion',
      'Ensure test tube points away from face',
      'Use tongs to handle hot glassware',
      'Do not inhale gases directly'
    ],
    observations: `Different salts show:
- CuSO₄·5H₂O: Blue → White (water loss)
- KMnO₄: Purple → Decomposition (O₂ evolved)
- KClO₃: Melts then evolves O₂ (splint relights)
- CaCO₃: No change (needs much higher temperature)
- Ammonium salts: Evolve NH₃ (pungent smell)`,
    calculations: `CuSO₄·5H₂O → CuSO₄ + 5H₂O
Mass of water lost = Initial mass - Final mass
Percent water = (Mass of water / Initial mass) × 100`,
    simulationContent: `<div style="padding: 20px; background: #ff9a56; color: white;"><h3>Heating Salts</h3><p>CuSO₄•5H₂O: Blue→White (dehydration) | KMnO₄: Decomposes O₂ | NH₄Cl: Sublimes to vapor | CaCO₃: Very high temp needed</p></div>`,
  },
  {
    subject: 'Chemistry',
    title: '8. Chemical Calculations',
    slug: 'chemical-calculations',
    description: 'Calculations based on moles, mass, volume, concentration, and balanced chemical equations from practical results.',
    order: 8,
    objectives: [
      'Perform mole calculations',
      'Calculate molarity and molality',
      'Use stoichiometry to find quantities',
      'Solve problems based on practical data'
    ],
    materials: [
      'Calculator',
      'Periodic table',
      'Practical results from other experiments',
      'Reference materials'
    ],
    procedure: `This is theoretical calculation practice using data from actual experiments:
1. Note all measured values from practical
2. Convert to moles using molar mass
3. Use balanced equations for stoichiometry
4. Calculate percentage yield or concentration
5. Analyze sources of error`,
    precautions: [
      'Double-check all calculations',
      'Use correct units throughout',
      'Reference accurate molar masses',
      'Account for significant figures'
    ],
    observations: `Different types of calculations:
- n = m/M (moles = mass / molar mass)
- M = n/V (molarity = moles / volume in L)
- Yield calculations (actual/theoretical × 100)
- Concentration calculations`,
    calculations: `Essential formulas:
- Moles = Mass (g) / Molar Mass (g/mol)
- Molarity (M) = Moles / Volume (L)
- % Yield = (Actual yield / Theoretical yield) × 100
- For reactions: n₁/coefficient₁ = n₂/coefficient₂`,
    simulationContent: `<div style="padding: 20px; background: #667eea; color: white;"><h3>Chemical Calculations</h3><p>n = m/M (moles) | M = n/V (molarity) | % Yield = (Actual/Theoretical)×100 | For reactions: n₁M₁V₁ = n₂M₂V₂</p></div>`,
  },

  // ==================== PHYSICS PRACTICALS ====================
  {
    subject: 'Physics',
    title: '1. Measurement and Units',
    slug: 'measurement-and-units',
    description: 'Use of vernier calipers, micrometer screw gauge, meter rule, and stopwatch to measure length, thickness, diameter, and time.',
    order: 1,
    objectives: [
      'Learn to use measuring instruments accurately',
      'Understand precision and accuracy',
      'Measure small dimensions using advanced tools',
      'Record measurements with correct significant figures'
    ],
    materials: [
      'Vernier calipers',
      'Micrometer screw gauge',
      'Meter rule',
      'Stopwatch',
      'Various objects for measurement',
      'Thread or wire',
      'Block of known dimensions'
    ],
    procedure: `1. METER RULE: Measure length to nearest 0.1 cm
2. VERNIER CALIPERS: Place object between jaws, read scale (0.01 cm precision)
3. MICROMETER: Align object with anvil, turn screw until taut, read (0.01 mm precision)
4. STOPWATCH: Start/stop to measure time intervals
5. Take multiple measurements for accuracy
6. Calculate average and error range`,
    precautions: [
      'Handle instruments gently',
      'Do not force micrometer screw',
      'Zero the instruments before use',
      'Take measurements at eye level',
      'Record all observations immediately'
    ],
    observations: `Measurement accuracy:
- Meter rule: ±0.05 cm
- Vernier calipers: ±0.01 cm (or ±0.05 mm)
- Micrometer: ±0.01 mm
- Stopwatch: ±0.01 s
- Multiple measurements reduce error`,
    calculations: `Uncertainty analysis:
- Absolute error = (Max reading - Min reading) / 2
- Relative error = Absolute error / Average value
- Percentage error = (Relative error) × 100%
- Final result = Average value ± Uncertainty`,
    simulationContent: `<div style="padding: 20px; background: #667eea; color: white;"><h3>Measurements</h3><p>Meter rule: ±0.05cm | Vernier: ±0.01cm | Micrometer: ±0.01mm | Multiple readings reduce error</p></div>`,
  },
  {
    subject: 'Physics',
    title: '2. Simple Pendulum',
    slug: 'simple-pendulum',
    description: 'Determining acceleration due to gravity (g) by measuring length and period of oscillation.',
    order: 2,
    objectives: [
      'Verify the relationship T² ∝ L',
      'Calculate acceleration due to gravity (g)',
      'Understand simple harmonic motion',
      'Plot and analyze graphs'
    ],
    materials: [
      'String or thread',
      'Bob (metal or plastic sphere)',
      'Meter rule',
      'Stopwatch',
      'Stand and clamp',
      'Graph paper'
    ],
    procedure: `1. Set up pendulum with length L = 100 cm
2. Give small displacement and release
3. Time 20 complete oscillations
4. Calculate T = (Total time) / 20
5. Repeat for lengths: 90, 80, 70, 60, 50, 40, 30 cm
6. Plot T² vs L graph
7. Find slope and calculate g = 4π²/slope`,
    precautions: [
      'Use small amplitude (< 5°)',
      'Ensure bob swings freely',
      'Record time for 20 oscillations',
      'Use meter rule vertically for length',
      'Protect from air currents'
    ],
    observations: `Results should show:
- Longer string → Longer period
- T² is directly proportional to L
- Graph is approximately straight line through origin
- Calculated g ≈ 9.8 m/s²`,
    calculations: `T = 2π√(L/g)
Therefore: T² = (4π²/g) × L
Slope of T² vs L = 4π²/g
g = 4π² / slope
g = 39.48 / slope`,
    simulationContent: `<div style="padding: 20px; background: #764ba2; color: white;"><h3>Pendulum Motion</h3><p>T² ∝ L (linear) | T = 2π√(L/g) | Plot T² vs L | g = 4π²/slope | g ≈ 9.8 m/s²</p></div>`,
  },
  {
    subject: 'Physics',
    title: '3. Hooke\'s Law (Spring Experiment)',
    slug: 'hookes-law-spring-experiment',
    description: 'Studying the relationship between force and extension of a spring and plotting graphs.',
    order: 3,
    objectives: [
      'Verify Hooke\'s Law: F = kx',
      'Determine spring constant (k)',
      'Understand elastic and plastic deformation',
      'Plot force-extension graph'
    ],
    materials: [
      'Spiral spring',
      'Weights (10g, 20g, 50g, etc.)',
      'Meter rule',
      'Stand and clamp',
      'Weight hanger',
      'Graph paper'
    ],
    procedure: `1. Attach spring to stand, note initial length (L₀)
2. Add 50g weight and measure length (L₁)
3. Extension x = L₁ - L₀
4. Add 100g weight and measure (continue)
5. Add weights up to 500g (avoiding permanent deformation)
6. For each mass: Force F = mg (in Newtons)
7. Plot F (y-axis) vs x (x-axis)
8. Find slope = k (spring constant)`,
    precautions: [
      'Do not exceed elastic limit of spring',
      'Add weights gently',
      'Wait for oscillations to stop before reading',
      'Use same reference point for all measurements',
      'Do not drop weights'
    ],
    observations: `Expected results:
- Linear relationship between F and x
- F = kx (straight line through origin)
- Spring constant k ≈ 10-20 N/m (typical)
- Graph is linear up to elastic limit`,
    calculations: `Hooke's Law: F = kx
Where:
- F = Force (N)
- k = Spring constant (N/m)
- x = Extension (m)

Spring constant k = Slope of F vs x graph = ΔF/Δx`,
    simulationContent: `<div style="padding: 20px; background: #f093fb; color: white;"><h3>Spring Constant</h3><p>F = kx | k = ΔF/Δx (slope) | Elastic limit important | k typically 10-20 N/m</p></div>`,
  },
  {
    subject: 'Physics',
    title: '4. Ohm\'s Law',
    slug: 'ohms-law',
    description: 'Determining the relationship between current, voltage, and resistance using resistors, ammeter, and voltmeter.',
    order: 4,
    objectives: [
      'Verify Ohm\'s Law: V = IR',
      'Understand resistance and conductivity',
      'Use ammeter and voltmeter correctly',
      'Plot and analyze V-I characteristics'
    ],
    materials: [
      'Variable power supply (0-12V)',
      'Ammeter (0-3A)',
      'Voltmeter (0-15V)',
      'Resistor (fixed)',
      'Rheostat (variable resistor)',
      'Connection wires',
      'Switch',
      'Graph paper'
    ],
    procedure: `1. Connect circuit: Power supply → Ammeter → Resistor → Rheostat → Switch
2. Connect Voltmeter in parallel across resistor
3. Start with rheostat at maximum resistance
4. Close switch and adjust for 0.5A current
5. Record Voltage (V) and Current (I)
6. Adjust rheostat and take readings for I = 1.0, 1.5, 2.0, 2.5 A
7. Plot V vs I graph
8. Calculate R from slope = V/I`,
    precautions: [
      'Use proper circuit connections',
      'Ammeter in series (low resistance)',
      'Voltmeter in parallel (high resistance)',
      'Start with high rheostat resistance',
      'Do not exceed maximum ratings of components'
    ],
    observations: `Results should show:
- Linear relationship between V and I
- V = IR holds true
- Straight line passing through origin
- Resistance R is constant for resistor`  ,
    calculations: `Ohm's Law: V = IR
Resistance: R = V / I
Slope of V vs I = R (Resistance in Ohms)
Power: P = VI = I²R = V²/R`,
    simulationContent: `<div style="padding: 20px; background: #4facfe; color: white;"><h3>Ohm's Law</h3><p>V = IR | R = V/I | Ammeter in series | Voltmeter in parallel | P = VI</p></div>`,
  },
  {
    subject: 'Physics',
    title: '5. Resistivity of a Wire',
    slug: 'resistivity-of-a-wire',
    description: 'Calculating resistivity using length, cross-sectional area, and resistance of a wire.',
    order: 5,
    objectives: [
      'Determine resistivity of a material',
      'Understand factors affecting resistance',
      'Measure wire dimensions accurately',
      'Apply formula R = ρL/A'
    ],
    materials: [
      'Wire of uniform cross-section (Nichrome or Constantan)',
      'Micrometer screw gauge',
      'Meter rule',
      'Ammeter',
      'Voltmeter',
      'Power supply',
      'Connection wires',
      'Switch'
    ],
    procedure: `1. Measure wire diameter using micrometer at 5 points
2. Calculate average diameter
3. Calculate cross-sectional area A = π(d/2)²
4. Measure wire length L using meter rule
5. Connect wire in circuit with ammeter and voltmeter
6. Apply voltage and measure current
7. Calculate resistance R = V/I
8. Calculate resistivity ρ = RA/L`,
    precautions: [
      'Use micrometer carefully',
      'Take multiple diameter measurements',
      'Ensure good electrical contact',
      'Do not overheat wire',
      'Use appropriate ammeter range'
    ],
    observations: `Typical resistivity values:
- Copper: 1.7 × 10⁻⁸ Ω·m
- Nichrome: 1.0 × 10⁻⁶ Ω·m
- Constantan: 4.9 × 10⁻⁷ Ω·m
- Results should match expected values`,
    calculations: `Resistivity formula: ρ = RA/L
Where:
- ρ = Resistivity (Ω·m)
- R = Resistance (Ω)
- A = Cross-sectional area (m²)
- L = Length (m)
- A = π(d/2)² where d is diameter`,
    simulationContent: `<div style="padding: 20px; background: #43e97b; color: white;"><h3>Resistivity</h3><p>ρ = RA/L | Cu: 1.7×10⁻⁸ Ω·m | Nichrome: 1.0×10⁻⁶ Ω·m | A = π(d/2)²</p></div>`,
  },
  {
    subject: 'Physics',
    title: '6. Refraction Through Glass Block',
    slug: 'refraction-through-glass-block',
    description: 'Tracing light rays to determine angle of incidence, refraction, and refractive index.',
    order: 6,
    objectives: [
      'Verify Snell\'s Law: n₁sinθ₁ = n₂sinθ₂',
      'Determine refractive index of glass',
      'Understand light refraction',
      'Plot sin θ₁ vs sin θ₂ graph'
    ],
    materials: [
      'Rectangular glass block',
      'Light source (pin or laser)',
      'Pins (4)',
      'Plain paper',
      'Protractor',
      'Ruler',
      'Normal drawn with pencil'
    ],
    procedure: `1. Place glass block on paper and trace outline
2. Draw normal at point of incidence
3. Place pins at incident rays making angles: 20°, 30°, 40°, 50°, 60°
4. Look through block and place pins at refracted ray
5. Remove block and trace ray path
6. Measure angles of incidence and refraction
7. Calculate sin θ for each angle
8. Plot sin θ₁ vs sin θ₂, slope = n`,
    precautions: [
      'Keep pins in vertical position',
      'Ensure glass block stays on paper',
      'Mark points carefully',
      'Use sharp pencil for accurate lines',
      'Work in room light, not bright sunlight'
    ],
    observations: `Results show:
- Ray bends toward normal on entering denser medium
- Angle of refraction < Angle of incidence
- Linear relationship between sin θ₁ and sin θ₂
- Calculated n ≈ 1.5 for glass`,
    calculations: `Snell's Law: n₁ sin θ₁ = n₂ sin θ₂
For air to glass: 1 × sin θ₁ = n × sin θ₂
n = sin θ₁ / sin θ₂
Refractive index of glass ≈ 1.5
tan θc = 1/n (Critical angle)`,
    simulationContent: `<div style="padding: 20px; background: #fa709a; color: white;"><h3>Snell's Law</h3><p>n₁sinθ₁ = n₂sinθ₂ | n = sinθ₁/sinθ₂ | Ray bends toward normal | n ≈ 1.5 for glass</p></div>`,
  },
  {
    subject: 'Physics',
    title: '7. Reflection of Light',
    slug: 'reflection-of-light',
    description: 'Use of plane mirror to verify laws of reflection and locate images.',
    order: 7,
    objectives: [
      'Verify laws of reflection',
      'Locate virtual image position',
      'Understand plane mirror properties',
      'Verify angle of incidence = angle of reflection'
    ],
    materials: [
      'Plane mirror',
      'Pins (3-4)',
      'Plain paper',
      'Ruler',
      'Protractor',
      'Wooden block (to support mirror)',
      'Pencil'
    ],
    procedure: `1. Place mirror on paper and trace position
2. Draw normal perpendicular to mirror
3. Place pin at incident ray (make angle with normal)
4. Place pin at reflected ray position
5. Mark several incident rays at different angles
6. Measure angle of incidence and reflection for each
7. Verify: angle i = angle r
8. Locate image position by finding intersection of reflected rays`,
    precautions: [
      'Keep mirror vertical',
      'Use sharp pencil lines',
      'Measure angles from normal, not mirror',
      'Support mirror securely',
      'Ensure no parallax error'
    ],
    observations: `Laws of reflection verified:
- Angle of incidence = Angle of reflection
- Both measured from normal
- Relationship holds for all angles
- Image is virtual, upright, same size`,
    calculations: `Laws of reflection:
1. Incident ray, reflected ray, and normal are coplanar
2. angle of incidence (i) = angle of reflection (r)
3. Image distance = Object distance
4. Image height = Object height (for plane mirror)`,
    simulationContent: `<div style="padding: 20px; background: #fee140; color: #333;"><h3>Reflection Laws</h3><p>i = r (both from normal) | Image virtual, upright | Same size as object | Works for all angles</p></div>`,
  },
  {
    subject: 'Physics',
    title: '8. Density Experiments',
    slug: 'density-experiments',
    description: 'Determining density of solids and liquids using mass and volume measurements.',
    order: 8,
    objectives: [
      'Calculate density using ρ = m/V',
      'Measure density of various materials',
      'Understand density variations',
      'Distinguish between density and specific gravity'
    ],
    materials: [
      'Balance (to 0.01g precision)',
      'Measuring cylinder',
      'Various solids (copper, iron, aluminum)',
      'Water',
      'Other liquids (oil, alcohol)',
      'Strings',
      'Displacement method equipment'
    ],
    procedure: `FOR SOLIDS:
1. Measure mass of solid on balance
2. For regular solids: Measure dimensions and calculate volume
3. For irregular solids: Use water displacement method
4. Calculate density ρ = m/V

FOR LIQUIDS:
1. Measure mass of measuring cylinder empty
2. Pour liquid to 100 mL mark
3. Measure mass of cylinder with liquid
4. Mass of liquid = Total mass - Cylinder mass
5. Calculate ρ = m/V = (mass of liquid) / 100 cm³`,
    precautions: [
      'Use clean, dry equipment',
      'For water displacement, ensure no water loss',
      'Handle fragile solids carefully',
      'Avoid parallax error in measuring cylinder',
      'Take measurements at eye level'
    ],
    observations: `Typical density values:
- Copper: 8.96 g/cm³
- Iron: 7.87 g/cm³
- Aluminum: 2.70 g/cm³
- Water: 1.00 g/cm³
- Oil: 0.92 g/cm³`,
    calculations: `Density formula: ρ = m/V
For solids: V = length × width × height (or calculated from shape)
For liquids: V measured in measuring cylinder
Relative density = Density of substance / Density of water
Percentage error = (Theoretical - Experimental) / Theoretical × 100%`,
    simulationContent: `<div style="padding: 20px; background: #09f7f7; color: #333;"><h3>Density</h3><p>ρ = m/V | Cu: 8.96 g/cm³ | Fe: 7.87 g/cm³ | Al: 2.70 g/cm³ | Water: 1.00 g/cm³</p></div>`,
  },
  {
    subject: 'Physics',
    title: '9. Heat Experiments',
    slug: 'heat-experiments',
    description: 'Experiments involving specific heat capacity and heat transfer.',
    order: 9,
    objectives: [
      'Determine specific heat capacity',
      'Understand heat transfer methods',
      'Apply Q = mcΔT formula',
      'Analyze calorimetry data'
    ],
    materials: [
      'Thermometer',
      'Calorimeter',
      'Stirrer',
      'Water',
      'Metal block (copper or iron)',
      'Balance',
      'Bunsen burner',
      'Tripod stand',
      'Beaker'
    ],
    procedure: `1. Measure mass of metal block
2. Heat block in boiling water to ~100°C
3. Measure initial temperature of water in calorimeter
4. Quickly transfer hot block to calorimeter
5. Record temperature at 30-second intervals
6. Stir gently and find maximum temperature
7. Calculate temperature change for block and water
8. Apply Q = mcΔT for both and solve for c`,
    precautions: [
      'Use boiling water carefully',
      'Handle hot metal with tongs',
      'Ensure thermometer is immersed',
      'Minimize heat loss - cover calorimeter',
      'Record temperatures quickly'
    ],
    observations: `Expected results:
- Metal block cools from ~100°C to room temperature
- Water heats up to equilibrium temperature
- Final temperature of block and water are equal
- Heat lost by block = Heat gained by water`,
    calculations: `Heat capacity: Q = mcΔT
For metal: Q = m_metal × c_metal × ΔT_metal
For water: Q = m_water × c_water × ΔT_water
Since Q_lost = Q_gained:
m_metal × c_metal × (T_initial - T_final) = m_water × c_water × (T_final - T_initial)
Specific heat capacity of water = 4200 J/(kg·K)`,
    simulationContent: `<div style="padding: 20px; background: #ff9a56; color: white;"><h3>Calorimetry</h3><p>Q = mcΔT | Heat lost = Heat gained | c_water = 4200 J/(kg·K) | Minimize heat loss</p></div>`,
  },
  {
    subject: 'Physics',
    title: '10. Sound Experiments',
    slug: 'sound-experiments',
    description: 'Simple demonstrations involving vibrations, resonance, or frequency.',
    order: 10,
    objectives: [
      'Understand sound wave properties',
      'Study vibrations and resonance',
      'Determine frequency of tuning forks',
      'Observe standing waves'
    ],
    materials: [
      'Tuning forks (various frequencies)',
      'Resonance tube',
      'Water and measuring scale',
      'Rubber hammer',
      'String',
      'Weights',
      'Microphone and frequency meter (optional)'
    ],
    procedure: `1. RESONANCE: Adjust water level in tube
2. Strike tuning fork and hold above tube opening
3. Find positions where sound amplifies (resonance)
4. Measure distance between resonance points
5. Calculate wavelength: λ = 2 × distance
6. Calculate frequency: f = v/λ (v = 340 m/s in air)
7. VIBRATIONS: Observe string vibration patterns with different weights`,
    precautions: [
      'Do not hit tuning fork too hard',
      'Keep water level constant',
      'Avoid noise interference',
      'Use gentle touches for string experiments',
      'Allow vibrations to settle before measurements'
    ],
    observations: `Expected observations:
- Resonance occurs at specific lengths
- Pattern of nodes and antinodes forms
- Frequency matches tuning fork frequency
- String produces harmonics`,
    calculations: `For resonance tube:
Length for 1st resonance: L₁ = λ/4
Length for 2nd resonance: L₂ = 3λ/4
Distance: L₂ - L₁ = λ/2
Wavelength: λ = 2(L₂ - L₁)
Frequency: f = v/λ where v = 340 m/s
For string: f = (1/2L)√(T/μ)`,
    simulationContent: `<div style="padding: 20px; background: #a8edea; color: #333;"><h3>Sound Waves</h3><p>v = fλ | v_air = 340 m/s | Resonance at λ/4, 3λ/4... | f = v/λ</p></div>`,
  },

  // ==================== BIOLOGY PRACTICALS ====================
  {
    subject: 'Biology',
    title: '1. Microscopy',
    slug: 'microscopy',
    description: 'Use of hand lens or microscope to observe cells, tissues, or microorganisms. Candidates identify parts and draw diagrams.',
    order: 1,
    objectives: [
      'Learn proper microscope handling and maintenance',
      'Observe cell structures and tissues',
      'Prepare slides correctly',
      'Identify and draw observations accurately'
    ],
    materials: [
      'Compound microscope',
      'Slides and coverslips',
      'Specimen (onion cells, blood cells, bacteria)',
      'Methylene blue stain',
      'Iodine solution',
      'Needle and forceps',
      'Lens paper',
      'Distilled water'
    ],
    procedure: `1. Clean microscope with lens paper
2. Prepare wet mount: Place specimen drop on slide
3. Apply stain (Methylene blue or Iodine)
4. Place coverslip gently
5. Start with lowest power objective
6. Adjust focus using fine adjustment screw
7. Move to higher power gradually
8. Draw observations in detail
9. Label all visible structures`,
    precautions: [
      'Handle microscope carefully',
      'Use lens paper only for lenses',
      'Never touch lens with fingers',
      'Start with lowest magnification',
      'Do not use high power on first attempt',
      'Ensure good lighting'
    ],
    observations: `Typical observations:
- Onion cells: Cell wall, nucleus, cytoplasm
- Blood cells: Red cells (biconcave), White cells (nucleus)
- Bacteria: Rod-shaped, cocci, spirilla
- Plant tissues: Xylem, Phloem, Parenchyma`,
    calculations: `Magnification = Objective power × Eyepiece power
Total magnification = Power of objective × Power of eyepiece
Example: 40× objective × 10× eyepiece = 400× total magnification
Field of view decreases with magnification`,
    simulationContent: `<div style="padding: 20px; background: #667eea; color: white;"><h3>Microscope Lab</h3><p>Magnification = Obj × Eye | Start lowest power | Fine focus carefully | Draw labeled diagrams</p></div>`,
  },
  {
    subject: 'Biology',
    title: '2. Biological Drawing',
    slug: 'biological-drawing',
    description: 'Drawing and labeling specimens such as leaves, flowers, insects, bones, or microscope slides.',
    order: 2,
    objectives: [
      'Develop observation skills',
      'Learn to draw biological specimens accurately',
      'Properly label anatomical structures',
      'Create scientific illustrations'
    ],
    materials: [
      'Specimens (leaves, flowers, insects, bones)',
      'White paper',
      'Pencils (HB and 2B)',
      'Ruler',
      'Eraser',
      'Hand lens',
      'Magnifying glass'
    ],
    procedure: `1. Examine specimen carefully using hand lens
2. Note overall shape and proportions
3. Sketch outline lightly
4. Add details gradually from center outward
5. Observe and draw internal structures if visible
6. Use fine lines for details
7. Label all identifiable parts with leader lines
8. Ensure drawing is accurate to actual size or indicate scale`,
    precautions: [
      'Use light pencil strokes initially',
      'Do not overpress pencil',
      'Handle specimens gently',
      'Work in well-lit area',
      'Take time for accurate drawing',
      'Do not damage specimen'
    ],
    observations: `Different specimens show:
- Leaves: Venation patterns, shape, margins
- Flowers: Petals, stamens, pistil, sepals
- Insects: Body segments, wings, legs, antennae
- Bones: Shape, ridges, joints`,
    calculations: `Scale for drawing = Actual size / Drawing size
Example: If specimen is 5 cm and drawn as 10 cm
Scale = 5/10 = 1:2 (half actual size)
Magnification = Drawing size / Actual size`,
    simulationContent: `<div style="padding: 20px; background: #764ba2; color: white;"><h3>Scientific Drawing</h3><p>Light pencil strokes | Add details gradually | Label all parts | Indicate scale/magnification</p></div>`,
  },
  {
    subject: 'Biology',
    title: '3. Classification of Living Organisms',
    slug: 'classification-of-living-organisms',
    description: 'Grouping specimens based on observable features (plants vs animals, insects vs arachnids, etc.).',
    order: 3,
    objectives: [
      'Understand classification principles',
      'Identify key characteristics for grouping',
      'Use dichotomous keys',
      'Classify organisms into appropriate taxa'
    ],
    materials: [
      'Various specimens (plants, insects, animals)',
      'Field guide or identification key',
      'Magnifying glass',
      'Ruler',
      'Specimen collection containers',
      'Labels'
    ],
    procedure: `1. Collect or observe various specimens
2. Use dichotomous key to identify
3. Note distinguishing features
4. Group by kingdom, phylum, class, order
5. Create classification chart or table
6. Compare similarities and differences
7. Present findings with organized layout`,
    precautions: [
      'Identify poisonous species before handling',
      'Collect specimens carefully',
      'Use appropriate containers',
      'Do not release invasive species',
      'Respect natural habitats',
      'Follow local regulations for collection'
    ],
    observations: `Classification features:
- Plants: Presence of chlorophyll, cell walls, fixed location
- Animals: Movement, heterotrophic, locomotion
- Insects: 6 legs, 3 body parts, antennae
- Arachnids: 8 legs, 2 body parts, no antennae`,
    calculations: `Biodiversity index = (Number of different species) / (Total number of individuals)
Example: If 30 individuals found of 5 different species
Index = 5/30 ≈ 0.17`,
    simulationContent: `<div style="padding: 20px; background: #f093fb; color: white;"><h3>Classification</h3><p>Use dichotomous key | Compare features | Biodiversity index = √(species count) | Organize in tables</p></div>`,
  },
  {
    subject: 'Biology',
    title: '4. External Features of Plants',
    slug: 'external-features-of-plants',
    description: 'Study of leaf shapes, venation, arrangement, stem types, and roots.',
    order: 4,
    objectives: [
      'Identify different leaf shapes and types',
      'Understand leaf venation patterns',
      'Classify stems and roots',
      'Relate structure to function'
    ],
    materials: [
      'Fresh plant specimens',
      'Leaves of various plants',
      'Magnifying glass',
      'Ruler',
      'Graph paper',
      'Pencil'
    ],
    procedure: `1. LEAVES: Observe shape (ovate, linear, palmate, pinnate)
2. Examine venation: Parallel, pinnate, palmate
3. Note leaf arrangement: Opposite, alternate, whorled
4. STEMS: Observe herbaceous vs woody
5. Note stem modifications (stolons, rhizomes)
6. ROOTS: Identify taproot vs fibrous
7. Create detailed drawings and labels
8. Organize findings in table format`,
    precautions: [
      'Handle plants gently',
      'Use fresh specimens for observation',
      'Work in natural light when possible',
      'Protect plants from damage',
      'Wash hands after handling'
    ],
    observations: `Plant structure variations:
- Monocots: Parallel venation, herbaceous stems
- Dicots: Reticulate (net) venation, woody stems
- Different roots for different habitats
- Leaf shape adapted to environment`,
    calculations: `Leaf area index (LAI) = (Total leaf area) / (Ground area covered)
Example: If leaves cover 4 m² above 1 m² ground
LAI = 4/1 = 4`,
    simulationContent: `<div style="padding: 20px; background: #4facfe; color: white;"><h3>Plant Structure</h3><p>Monocots: Parallel venation | Dicots: Net venation | Leaf arrangement: Opposite/Alternate/Whorled | Root types: Taproot/Fibrous</p></div>`,
  },
  {
    subject: 'Biology',
    title: '5. External Features of Animals',
    slug: 'external-features-of-animals',
    description: 'Identification of features such as segments, wings, legs, antennae, and body parts.',
    order: 5,
    objectives: [
      'Identify external anatomical structures',
      'Understand adaptations for different habitats',
      'Classify animals by body features',
      'Relate structure to lifestyle'
    ],
    materials: [
      'Animal specimens (insects, crustaceans)',
      'Magnifying glass',
      'White background for observation',
      'Pins or forceps',
      'Petri dish',
      'Reference guides'
    ],
    procedure: `1. Place specimen on white background
2. Observe and sketch overall body shape
3. Count and describe legs: Number, structure, joints
4. Identify wings: Type, venation, position
5. Note antennae: Length, structure, position
6. Observe mouth parts: Type adapted for diet
7. Identify segmentation of body
8. Compare with reference guide for classification`,
    precautions: [
      'Handle specimens carefully',
      'Do not crush delicate structures',
      'Use forceps for manipulation',
      'Identify stinging or biting species',
      'Observe in appropriate containers',
      'Return specimens to nature if collected alive'
    ],
    observations: `Key identification features:
- Insect vs Arachnid: Leg number (6 vs 8)
- Flying insects: Wing structures
- Aquatic adaptations: Flattened bodies, fringed legs
- Mouth parts: Adapted for biting, sucking, lapping`,
    calculations: `Arthropod body segment count
Example: Insect has 3 main segments (head, thorax, abdomen)
Arachnids have 2 main segments (cephalothorax, abdomen)
Crustaceans have segmented trunk with many segments`,
    simulationContent: `<div style="padding: 20px; background: #43e97b; color: white;"><h3>Animal Features</h3><p>Insects: 6 legs, 3 parts, antennae | Arachnids: 8 legs, 2 parts | Compare mouth parts to diet</p></div>`,
  },
  {
    subject: 'Biology',
    title: '6. Food Tests',
    slug: 'food-tests',
    description: 'Testing for starch, sugar, protein, fats, and oils using iodine, Benedict\'s solution, Biuret test, etc.',
    order: 6,
    objectives: [
      'Identify presence of different nutrients',
      'Understand chemical reactions with reagents',
      'Apply biochemical tests to food samples',
      'Interpret color changes correctly'
    ],
    materials: [
      'Food samples (starch, sugar, protein, oil)',
      'Iodine solution',
      'Benedict\'s solution',
      'Biuret reagent',
      'Sudan IV solution',
      'Test tubes',
      'Test tube rack',
      'Bunsen burner',
      'Tripod stand'
    ],
    procedure: `STARCH TEST: Add iodine to sample → Blue-black color
SUGAR TEST: Heat with Benedict\'s → Orange-red precipitate
PROTEIN TEST: Biuret test → Purple/violet color
FAT/OIL TEST: Add Sudan IV → Orange-red color in fat layer
Test each food sample for all nutrients:
1. Prepare sample extract in water
2. Divide into portions
3. Add different reagents
4. Record color changes
5. Interpret positive/negative results`,
    precautions: [
      'Wear safety goggles',
      'Be careful with hot water for Benedict\'s test',
      'Avoid skin contact with reagents',
      'Do not inhale fumes',
      'Dispose of chemical waste properly'
    ],
    observations: `Color changes indicate:
- Iodine: Blue-black = Starch present
- Benedict\'s: Orange-red precipitate = Reducing sugar
- Biuret: Purple = Protein present
- Sudan IV: Orange layer = Fats/Oils present`,
    calculations: `Quantitative analysis:
- Semi-quantitative Benedict\'s: Intensity of color indicates sugar amount
- Protein concentration can be estimated using standard
- Fat content can be compared visually between samples`,
    simulationContent: `<div style="padding: 20px; background: #fa709a; color: white;"><h3>Nutrient Tests</h3><p>Iodine: Blue-black = Starch | Benedict's: Orange ppt = Sugar | Biuret: Purple = Protein | Sudan IV: Orange = Fats/Oils</p></div>`,
  },
  {
    subject: 'Biology',
    title: '7. Ecology Practical',
    slug: 'ecology-practical',
    description: 'Study of soil types, population sampling, food chains, and simple ecological instruments.',
    order: 7,
    objectives: [
      'Understand ecological principles',
      'Study biodiversity in habitat',
      'Learn population sampling methods',
      'Analyze food chains and energy flow'
    ],
    materials: [
      'Quadrat or transect tape',
      'Soil auger or trowel',
      'pH paper',
      'Thermometer',
      'Hand lens',
      'Collecting containers',
      'Field guide',
      'Measuring scale'
    ],
    procedure: `1. POPULATION SAMPLING: Place quadrat randomly
2. Count and identify all species within quadrat
3. Repeat at 5-10 locations
4. Calculate species diversity and abundance
5. SOIL ANALYSIS: Collect soil samples
6. Test for pH using pH paper
7. Observe soil composition (sand, silt, clay)
8. FOOD CHAINS: Identify producers, consumers, decomposers
9. Draw food web based on observations`,
    precautions: [
      'Do not damage habitat',
      'Replace soil samples carefully',
      'Identify poisonous plants',
      'Avoid disturbing nests or burrows',
      'Work with permission on private land',
      'Wash hands after fieldwork'
    ],
    observations: `Ecological data:
- Species distribution patterns
- Soil types and properties
- Population densities
- Predator-prey relationships`,
    calculations: `Biodiversity = √(Number of species)
Species diversity index = (Number of species) / (Number of individuals)
Quadrat population = (Quadrats sampled) × (Average density)
Food chain energy: Only ~10% passes to next level`,
    simulationContent: `<div style="padding: 20px; background: #fee140; color: #333;"><h3>Ecology</h3><p>Quadrat sampling | Diversity index = √(species count) | Food chains & webs | Energy transfer 10%</p></div>`,
  },
  {
    subject: 'Biology',
    title: '8. Reproduction in Plants',
    slug: 'reproduction-in-plants',
    description: 'Observation of flowers, fruits, seeds, and identification of reproductive parts.',
    order: 8,
    objectives: [
      'Identify flower structure and parts',
      'Understand sexual reproduction in plants',
      'Study seed and fruit structure',
      'Relate structure to pollination and dispersal'
    ],
    materials: [
      'Fresh flowers (various species)',
      'Mature fruits',
      'Seeds (various types)',
      'Magnifying glass',
      'Dissecting needle',
      'White background',
      'Hand lens'
    ],
    procedure: `1. FLOWER STRUCTURE:
- Identify sepals, petals, stamens, pistil
- Locate pollen sacs, stigma, ovary
- Observe modifications (color, number of parts)
2. REPRODUCTION:
- Note pollination adaptation
- Observe pollen grains under microscope
3. FRUITS AND SEEDS:
- Dissect fruit to find seeds
- Note seed structure: testa, cotyledons, radicle
- Identify seed dispersal method (wind, water, animal)`,
    precautions: [
      'Handle flowers gently',
      'Use fresh specimens',
      'Dissect carefully to preserve parts',
      'Store properly if not using immediately',
      'Observe hygiene with pollen'
    ],
    observations: `Reproductive variations:
- Insect-pollinated flowers: Colorful, fragrant, nectar
- Wind-pollinated flowers: Small, plain, abundant pollen
- Self-pollinating flowers: Simple structure
- Dry fruits for wind/water dispersal
- Fleshy fruits for animal dispersal`,
    calculations: `Pollination efficiency: (Seeds produced) / (Pollen grains) × 100
Seed viability: (Germinated seeds) / (Total seeds) × 100
Example: If 50 seeds germinate out of 100 seeds = 50% viability`,
    simulationContent: `<div style="padding: 20px; background: #09f7f7; color: #333;"><h3>Plant Reproduction</h3><p>Flower parts: Sepals, petals, stamens, pistil | Insect-pollinated: Colorful, fragrant | Wind-pollinated: Small, plain</p></div>`,
  },
  {
    subject: 'Biology',
    title: '9. Transport Systems',
    slug: 'transport-systems',
    description: 'Study of xylem and phloem, blood components (theoretical or specimen-based).',
    order: 9,
    objectives: [
      'Understand plant and animal transport',
      'Identify xylem and phloem structures',
      'Study blood cells and components',
      'Relate structure to function'
    ],
    materials: [
      'Plant stems (fresh)',
      'Razor blade or knife',
      'Microscope slides',
      'Stain (Safranin or Methylene blue)',
      'Blood slide (pre-made)',
      'Microscope',
      'Colored ink or food dye',
      'White flowers'
    ],
    procedure: `PLANT TRANSPORT:
1. Cut fresh stem cross-section thinly
2. Stain with Safranin or Iodine
3. Observe xylem (contains water, stained blue-black)
4. Observe phloem (contains sap)
5. Note vessel arrangement in vascular bundles

ANIMAL TRANSPORT:
1. Observe prepared blood slide
2. Identify RBC (no nucleus, disk-shaped)
3. Identify WBC (with nucleus, fewer in number)
4. Identify platelets (small, no nucleus)
5. Note blood cell ratios`,
    precautions: [
      'Use new blade for fresh cuts',
      'Handle glass carefully',
      'Avoid contact with blood samples',
      'Wash hands after handling',
      'Use universal precautions with blood'
    ],
    observations: `Transport system structures:
- Xylem: Vessel elements (tubes without cross-walls)
- Phloem: Sieve tubes (with cross-walls for sap transport)
- RBC: 4.5-5.5 million per µL
- WBC: 5,000-10,000 per µL
- Platelets: 150,000-400,000 per µL`,
    calculations: `Cell ratios in blood:
RBC:WBC ratio = approximately 1000:1
WBC differential: Neutrophils 50-70%, Lymphocytes 20-40%, Others <10%
Hematocrit: Percentage of RBC in blood ≈ 40-45%`,
    simulationContent: `<div style="padding: 20px; background: #ff9a56; color: white;"><h3>Transport Systems</h3><p>Xylem: Water transport | Phloem: Sap transport | RBC: No nucleus | WBC: With nucleus | RBC:WBC ≈ 1000:1</p></div>`,
  },
  {
    subject: 'Biology',
    title: '10. Adaptation',
    slug: 'adaptation',
    description: 'Identifying features that help plants or animals survive in their environment.',
    order: 10,
    objectives: [
      'Understand adaptation concepts',
      'Identify structural adaptations',
      'Study behavioral and physiological adaptations',
      'Relate organisms to their habitats'
    ],
    materials: [
      'Specimens from different habitats',
      'Photographs or diagrams',
      'Magnifying glass',
      'Field guide or reference materials',
      'Collecting equipment for field study'
    ],
    procedure: `1. STRUCTURAL ADAPTATIONS:
- Observe body shape, size, color
- Note modified structures (thorns, scales, claws)
- Identify special sensory organs
2. PHYSIOLOGICAL ADAPTATIONS:
- Study metabolism adaptations
- Observe camouflage and warning colors
3. BEHAVIORAL ADAPTATIONS:
- Migration patterns
- Feeding behaviors
- Mating behaviors
4. HABITAT MATCHING:
- Compare adaptations to environmental demands
- Explain survival advantage of each adaptation`,
    precautions: [
      'Handle specimens carefully',
      'Identify dangerous species',
      'Observe ethical collection practices',
      'Do not harm animals during observation',
      'Return specimens to habitat after study'
    ],
    observations: `Adaptation examples:
DESERT: Thick skin, reduced leaves, efficient kidneys
AQUATIC: Streamlined body, gills, fins, webbed feet
ARCTIC: Thick fur, layers of fat, white coloring
FOREST: Camouflage, climbing adaptations, echolocation`,
    calculations: `Evolutionary fitness can be estimated from:
- Survival rate: (Survivors / Initial population) × 100
- Reproduction rate: (Offspring produced) / (Population size)
- Example: If 80 animals out of 100 survive = 80% fitness`,
    simulationContent: `<div style="padding: 20px; background: #a8edea; color: #333;"><h3>Adaptations</h3><p>Structural: Body shape, color | Physiological: Metabolism, camouflage | Behavioral: Migration, feeding | Desert/Aquatic/Arctic/Forest adaptations</p></div>`,
  },
];

module.exports = sampleLabs;
