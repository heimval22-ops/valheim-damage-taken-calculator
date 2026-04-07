# Star Level × Combat Difficulty: Multiplicative Proof

> **Source:** Decompiled IL from `assembly_valheim.dll` (Valheim game code).
> Combat modifier preset values extracted from the `StartGui_ServerOptions` Unity prefab.

---

## TL;DR — They Are **Multiplicative**

Star level, combat difficulty, and multiplayer scaling are applied as **separate sequential multiplications**, not added together.

| Scenario | Formula | Result |
|---|---|---|
| 1★ Club Fuling, Hard, solo | 85 × **1.5** (star) × **1.0** (1 player) × **1.5** (Hard) | **191.25** |
| 1★ Club Fuling, Hard, 3 players | 85 × **1.5** (star) × **1.08** (3 players) × **1.5** (Hard) | **206.55** |
| 1★ Club Fuling, Very Hard, 3 players | 85 × **1.5** (star) × **1.08** (3 players) × **2.0** (V.Hard) | **275.40** |
| If all were additive instead | 85 × (1 + 0.5 + 0.08 + 1.0) | 219.30 ← wrong |

---

## The Damage Pipeline

When a mob attacks a player, damage flows through two main stages:

### Stage 1 — Attacker Side (`Attack.ModifyDamage`)

Called when the attack is created. Applies multipliers **in sequence**:

```
hitData.m_damage.Modify(m_damageMultiplier)         // weapon-specific (skip if 1.0)
hitData.m_damage.Modify(damageFactor)                // animation/combo factor (skip if 1.0)
hitData.m_damage.Modify(GetLevelDamageFactor())      // ★ STAR LEVEL — always applied
hitData.m_damage.Modify(1 + missingHP * perHPMult)   // only if m_damageMultiplierPerMissingHP > 0
hitData.m_damage.Modify(1 + (1-hpPct) * totalMult)   // only if m_damageMultiplierByTotalHealthMissing > 0
```

### Stage 2 — Receiver Side (`Character.RPC_Damage`)

Called on the target when damage is received. For mob → player damage:

```
hitData.ApplyModifier(GetDifficultyDamageScalePlayer(pos))  // multiplayer proximity scaling
hitData.ApplyModifier(Game.m_enemyDamageRate)                // ★ COMBAT DIFFICULTY — always applied
```

Both `DamageTypes.Modify(float)` and `HitData.ApplyModifier(float)` **multiply** every damage field by the scalar. There is no addition pathway.

---

## IL Proof: `Attack.GetLevelDamageFactor`

**Reconstructed C#:**
```csharp
float GetLevelDamageFactor() {
    return 1.0f + Mathf.Max(0, m_character.GetLevel() - 1) * 0.5f;
}
```

| Stars | GetLevel() | Factor |
|-------|-----------|--------|
| 0★    | 1         | 1.0    |
| 1★    | 2         | 1.5    |
| 2★    | 3         | 2.0    |

**Raw IL:**
```
IL_0000: ldc.r4 1              // push 1.0f
IL_0005: ldc.i4.0              // push 0
IL_0006: ldarg.0               // this
IL_0007: ldfld  Attack.m_character
IL_000C: callvirt Character.GetLevel()
IL_0011: ldc.i4.1              // push 1
IL_0012: sub                   // GetLevel() - 1
IL_0013: call   Mathf.Max      // Max(0, level - 1)
IL_0018: conv.r4               // convert to float
IL_0019: ldc.r4 0.5            // push 0.5f
IL_001E: mul                   // Max(0, level-1) * 0.5
IL_001F: add                   // 1.0 + above
IL_0020: ret
```

---

## IL Proof: `Attack.ModifyDamage`

**Reconstructed C#:**
```csharp
void ModifyDamage(HitData hit, float damageFactor) {
    if (m_damageMultiplier != 1f)
        hit.m_damage.Modify(m_damageMultiplier);

    if (damageFactor != 1f)
        hit.m_damage.Modify(damageFactor);

    hit.m_damage.Modify(GetLevelDamageFactor());  // ALWAYS applied — star level

    if (m_damageMultiplierPerMissingHP > 0f)
        hit.m_damage.Modify(1f + (GetMaxHealth() - GetHealth()) * m_damageMultiplierPerMissingHP);

    if (m_damageMultiplierByTotalHealthMissing > 0f)
        hit.m_damage.Modify(1f + (1f - GetHealthPercentage()) * m_damageMultiplierByTotalHealthMissing);
}
```

**Raw IL:**
```
// --- Section 1: weapon multiplier (skip if == 1.0) ---
IL_0000: ldarg.0
IL_0001: ldfld  Attack.m_damageMultiplier
IL_0006: ldc.r4 1
IL_000B: beq.s  IL_001E              // skip if multiplier == 1
IL_000D: ldarg.1
IL_000E: ldflda HitData.m_damage
IL_0013: ldarg.0
IL_0014: ldfld  Attack.m_damageMultiplier
IL_0019: call   DamageTypes.Modify   // damage *= m_damageMultiplier

// --- Section 2: animation/combo factor (skip if == 1.0) ---
IL_001E: ldarg.2
IL_001F: ldc.r4 1
IL_0024: beq.s  IL_0032              // skip if factor == 1
IL_0026: ldarg.1
IL_0027: ldflda HitData.m_damage
IL_002C: ldarg.2
IL_002D: call   DamageTypes.Modify   // damage *= damageFactor

// --- Section 3: STAR LEVEL (always applied) ---
IL_0032: ldarg.1
IL_0033: ldflda HitData.m_damage
IL_0038: ldarg.0
IL_0039: call   Attack.GetLevelDamageFactor
IL_003E: call   DamageTypes.Modify   // damage *= GetLevelDamageFactor()

// --- Section 4: missing HP multiplier (conditional) ---
IL_0043: ldarg.0
IL_0044: ldfld  Attack.m_damageMultiplierPerMissingHP
IL_0049: ldc.r4 0
IL_004E: ble.un.s IL_007F            // skip if <= 0
IL_0050: ldarg.1
IL_0051: ldflda HitData.m_damage
IL_0056: ldc.r4 1
IL_005C: ldfld  Attack.m_character
IL_0061: callvirt GetMaxHealth()
IL_0067: ldfld  Attack.m_character
IL_006C: callvirt GetHealth()
IL_0071: sub                         // maxHP - HP
IL_0073: ldfld  Attack.m_damageMultiplierPerMissingHP
IL_0078: mul                         // missing * mult
IL_0079: add                         // 1 + above
IL_007A: call   DamageTypes.Modify   // damage *= (1 + missingHP * rate)

// --- Section 5: total health missing multiplier (conditional) ---
IL_007F: ldarg.0
IL_0080: ldfld  Attack.m_damageMultiplierByTotalHealthMissing
IL_0085: ldc.r4 0
IL_008A: ble.un.s IL_00B5            // skip if <= 0
IL_008C: ldarg.1
IL_008D: ldflda HitData.m_damage
IL_0092: ldc.r4 1
IL_0097: ldc.r4 1
IL_009D: ldfld  Attack.m_character
IL_00A2: callvirt GetHealthPercentage()
IL_00A7: sub                         // 1 - healthPct
IL_00A9: ldfld  Attack.m_damageMultiplierByTotalHealthMissing
IL_00AE: mul
IL_00AF: add                         // 1 + (1 - pct) * rate
IL_00B0: call   DamageTypes.Modify
IL_00B5: ret
```

---

## IL Proof: `DamageTypes.Modify(float)`

**Reconstructed C#:**
```csharp
void Modify(float multiplier) {
    m_damage    *= multiplier;
    m_blunt     *= multiplier;
    m_slash     *= multiplier;
    m_pierce    *= multiplier;
    m_chop      *= multiplier;
    m_pickaxe   *= multiplier;
    m_fire      *= multiplier;
    m_frost     *= multiplier;
    m_lightning *= multiplier;
    m_poison    *= multiplier;
    m_spirit    *= multiplier;
}
```

**Raw IL (pattern repeats for all 11 fields):**
```
IL_0000: ldarg.0                    // this (ref to struct)
IL_0001: ldarg.0
IL_0002: ldfld  DamageTypes.m_damage
IL_0007: ldarg.1                    // multiplier
IL_0008: mul                        // field * multiplier
IL_0009: stfld  DamageTypes.m_damage
// ... same pattern for m_blunt, m_slash, m_pierce, m_chop,
//     m_pickaxe, m_fire, m_frost, m_lightning, m_poison, m_spirit
IL_009A: ret
```

---

## IL Proof: `HitData.ApplyModifier(float)`

**Reconstructed C#:**
```csharp
void ApplyModifier(float modifier) {
    m_damage.m_blunt     *= modifier;
    m_damage.m_slash     *= modifier;
    m_damage.m_pierce    *= modifier;
    m_damage.m_chop      *= modifier;
    m_damage.m_pickaxe   *= modifier;
    m_damage.m_fire      *= modifier;
    m_damage.m_frost     *= modifier;
    m_damage.m_lightning *= modifier;
    m_damage.m_poison    *= modifier;
    m_damage.m_spirit    *= modifier;
}
```

Note: `ApplyModifier` multiplies individual typed damage fields (not `m_damage` generic).

**Raw IL (pattern repeats for all 10 typed fields):**
```
IL_0000: ldarg.0
IL_0001: ldflda HitData.m_damage
IL_0006: ldflda DamageTypes.m_blunt
IL_000B: dup
IL_000C: ldind.r4                   // load current value
IL_000D: ldarg.1                    // modifier
IL_000E: mul                        // value * modifier
IL_000F: stind.r4                   // store back
// ... repeats for m_slash, m_pierce, m_chop, m_pickaxe,
//     m_fire, m_frost, m_lightning, m_poison, m_spirit
IL_00A0: ret
```

---

## IL Proof: Receiver-Side Difficulty Scaling

### `Character.RPC_Damage` (mob → player path)

When a mob hits a player, `RPC_Damage` applies:

```csharp
// If attacker is NOT a player:
hitData.ApplyModifier(Game.instance.GetDifficultyDamageScalePlayer(transform.position));
hitData.ApplyModifier(Game.m_enemyDamageRate);
```

Both calls are sequential `ApplyModifier` (multiplication), not addition.

### `Game.GetDifficultyDamageScalePlayer(Vector3 pos)`

**Reconstructed C#:**
```csharp
float GetDifficultyDamageScalePlayer(Vector3 pos) {
    int playerCount = GetPlayerDifficulty(pos);
    return 1f + (playerCount - 1) * m_damageScalePerPlayer;
}
```

**Raw IL:**
```
IL_0000: ldarg.0                         // this (Game)
IL_0001: ldarg.1                         // pos
IL_0002: call   Game.GetPlayerDifficulty // count nearby players
IL_0007: stloc.0
IL_0008: ldc.r4 1                        // 1.0f
IL_000D: ldloc.0
IL_000E: ldc.i4.1
IL_000F: sub                             // playerCount - 1
IL_0010: conv.r4
IL_0011: ldarg.0
IL_0012: ldfld  Game.m_damageScalePerPlayer
IL_0017: mul                             // (count-1) * scale
IL_0018: add                             // 1 + above
IL_0019: ret
```

### `Game.GetDifficultyDamageScaleEnemy(Vector3 pos)`

**Reconstructed C#:**
```csharp
float GetDifficultyDamageScaleEnemy(Vector3 pos) {
    int playerCount = GetPlayerDifficulty(pos);
    float scale = 1f + (playerCount - 1) * m_healthScalePerPlayer;
    return 1f / scale;
}
```

**Raw IL:**
```
IL_0000: ldarg.0
IL_0001: ldarg.1
IL_0002: call   Game.GetPlayerDifficulty
IL_0007: stloc.0
IL_0008: ldc.r4 1
IL_000D: ldloc.0
IL_000E: ldc.i4.1
IL_000F: sub
IL_0010: conv.r4
IL_0011: ldarg.0
IL_0012: ldfld  Game.m_healthScalePerPlayer
IL_0017: mul
IL_0018: add
IL_0019: stloc.1                         // scale
IL_001A: ldc.r4 1
IL_001F: ldloc.1
IL_0020: div                             // 1.0 / scale
IL_0021: ret
```

---

## Combat Difficulty Presets (from Unity Prefab Data)

Extracted from `StartGui_ServerOptions.prefab` — the Combat KeySlider's `m_settings`:

`Game.UpdateWorldRates` reads these stored values and divides by **100** (`trySetScalarKey` multiplier).

| Combat Setting | Stored | m_playerDamageRate | m_enemyDamageRate | m_enemySpeedSize | m_enemyLevelUpRate |
|---------------|--------|-------------------|------------------|-----------------|-------------------|
| **Very Easy** | pd=125, ed=50 | **1.25** | **0.50** | 0.90 | 1.00 |
| **Easy** | pd=110, ed=75 | **1.10** | **0.75** | 0.95 | 1.00 |
| **Normal** | (defaults) | **1.00** | **1.00** | 1.00 | 1.00 |
| **Hard** | pd=85, ed=150 | **0.85** | **1.50** | 1.10 | 1.20 |
| **Very Hard** | pd=70, ed=200 | **0.70** | **2.00** | 1.20 | 1.40 |

> `m_playerDamageRate` — multiplier on damage players deal to enemies.
> `m_enemyDamageRate` — multiplier on damage enemies deal to players.

---

## Worked Example: 1★ Club Fuling on Hard

| Step | Operation | Value |
|------|-----------|-------|
| Base damage (GoblinClub prefab) | `m_blunt = 85.0` | 85.0 |
| Star level (1★ = level 2) | `× GetLevelDamageFactor()` = `1 + (2-1)*0.5` = 1.5 | 127.5 |
| Combat difficulty (Hard) | `× m_enemyDamageRate` = 1.5 | **191.25** |

If they were **additive** (50% + 50% = 100% bonus):
- 85 × (1 + 0.5 + 0.5) = 85 × 2.0 = **170** ← not what the code does

The code applies them as **separate multiplications**:
- 85 × 1.5 × 1.5 = **191.25** ✓

---

## Multiplayer Proximity Scaling

When multiple players are nearby, mobs deal **more** damage and players deal **less** damage per hit (to compensate for more attackers).

### Default Constants (from `Game` constructor IL)

```
IL_00AD: ldc.r4 100
IL_00B2: stfld  Game.m_difficultyScaleRange       // 100m radius
IL_00B8: ldc.i4.5
IL_00B9: stfld  Game.m_difficultyScaleMaxPlayers   // cap at 5 players
IL_00BF: ldc.r4 0.04
IL_00C4: stfld  Game.m_damageScalePerPlayer         // +4% mob dmg per extra player
IL_00CA: ldc.r4 0.3
IL_00CF: stfld  Game.m_healthScalePerPlayer          // +30% effective mob HP per extra player
```

| Field | Default | Meaning |
|-------|---------|---------|
| `m_difficultyScaleRange` | **100m** | Horizontal radius for counting nearby players |
| `m_difficultyScaleMaxPlayers` | **5** | Maximum counted players |
| `m_damageScalePerPlayer` | **0.04** | Mob damage increase per extra player |
| `m_healthScalePerPlayer` | **0.30** | Effective mob HP increase per extra player |

### IL Proof: `Game.GetPlayerDifficulty(Vector3 pos)`

**Reconstructed C#:**
```csharp
int GetPlayerDifficulty(Vector3 pos) {
    if (m_forcePlayers > 0) return m_forcePlayers;   // debug override
    int count = Player.GetPlayersInRangeXZ(pos, m_difficultyScaleRange);
    return Mathf.Clamp(count, 1, m_difficultyScaleMaxPlayers);
}
```

**Raw IL:**
```
IL_0000: ldarg.0
IL_0001: ldfld  Game.m_forcePlayers
IL_0006: ldc.i4.0
IL_0007: ble.s  IL_0011
IL_0009: ldarg.0
IL_000A: ldfld  Game.m_forcePlayers       // if m_forcePlayers > 0, return it
IL_000F: br.s   IL_0025
IL_0011: ldarg.1                          // pos
IL_0012: ldarg.0
IL_0013: ldfld  Game.m_difficultyScaleRange
IL_0018: call   Player.GetPlayersInRangeXZ  // count players within 100m (XZ plane)
IL_001D: ldc.i4.1
IL_001E: ldarg.0
IL_001F: ldfld  Game.m_difficultyScaleMaxPlayers
IL_0024: call   Mathf.Clamp              // clamp to [1, 5]
IL_0025: ret
```

> **Note:** `Player.GetPlayersInRangeXZ` counts all players within `m_difficultyScaleRange` meters on the horizontal plane (XZ distance, ignoring height). The token (0x060003CE) falls in the Player type range which cannot be loaded via standalone reflection, but the method name is confirmed via binary string search in the DLL.

### Formulas

**Mob → Player damage** (mobs hit harder with more players nearby):
```
DamageScalePlayer = 1 + (playerCount - 1) × 0.04
```

**Player → Mob damage** (each player deals less per hit, simulating more HP):
```
DamageScaleEnemy = 1 / (1 + (playerCount - 1) × 0.30)
```

### Multiplayer Scaling Tables

**Mob damage received by player** (`GetDifficultyDamageScalePlayer`):

| Players | Formula | Multiplier | Effect |
|---------|---------|------------|--------|
| 1 | 1 + 0 × 0.04 | **1.00×** | baseline |
| 2 | 1 + 1 × 0.04 | **1.04×** | +4% damage |
| 3 | 1 + 2 × 0.04 | **1.08×** | +8% damage |
| 4 | 1 + 3 × 0.04 | **1.12×** | +12% damage |
| 5 | 1 + 4 × 0.04 | **1.16×** | +16% damage |

**Player damage dealt to mob** (`GetDifficultyDamageScaleEnemy`):

| Players | Formula | Multiplier | Effective Mob HP |
|---------|---------|------------|-----------------|
| 1 | 1 / (1 + 0 × 0.30) | **1.000×** | 1.0× (baseline) |
| 2 | 1 / (1 + 1 × 0.30) | **0.769×** | 1.3× |
| 3 | 1 / (1 + 2 × 0.30) | **0.625×** | 1.6× |
| 4 | 1 / (1 + 3 × 0.30) | **0.526×** | 1.9× |
| 5 | 1 / (1 + 4 × 0.30) | **0.455×** | 2.2× |

> **Effective Mob HP** = the inverse of the damage multiplier. At 4 players, each player does ~52.6% damage, so the mob effectively has 1.9× its listed HP. With all 4 players attacking, total DPS is 4 × 0.526 = 2.105× solo DPS — mobs still die faster, but not 4× faster.

### Complete Worked Example: 1★ Club Fuling

Base damage = **85 Blunt** (from GoblinClub prefab)

**Damage TO the player (mob → player):**

| | Solo | 2 Players | 3 Players | 4 Players |
|---|---|---|---|---|
| **Normal** | 85 × 1.5 × 1.00 × 1.0 = **127.5** | × 1.04 = **132.6** | × 1.08 = **137.7** | × 1.12 = **142.8** |
| **Hard** | 85 × 1.5 × 1.00 × 1.5 = **191.3** | × 1.04 = **198.9** | × 1.08 = **206.6** | × 1.12 = **214.2** |
| **Very Hard** | 85 × 1.5 × 1.00 × 2.0 = **255.0** | × 1.04 = **265.2** | × 1.08 = **275.4** | × 1.12 = **285.6** |

> Formula: `baseDmg × starLevel × DamageScalePlayer(n) × m_enemyDamageRate`

**Effective mob HP multiplier (player → mob):**

| | Solo | 2 Players | 3 Players | 4 Players |
|---|---|---|---|---|
| **Normal** | 1.0× per hit | 0.769× per hit | 0.625× per hit | 0.526× per hit |
| **Hard** | × 0.85 | × 0.85 | × 0.85 | × 0.85 |

> On Hard, `m_playerDamageRate = 0.85` further reduces player damage.
> Combined: 4 players on Hard = each hit does `0.526 × 0.85 = 0.447×` of solo Normal damage to the mob.

### Full Damage Pipeline Summary

```
Mob → Player damage =
    baseDamage
    × GetLevelDamageFactor()           // star level: 1.0 / 1.5 / 2.0
    × GetDifficultyDamageScalePlayer() // multiplayer: 1 + (n-1) × 0.04
    × m_enemyDamageRate                // combat difficulty: 0.5 – 2.0

Player → Mob damage =
    weaponDamage
    × playerSkillModifiers             // skill-based bonuses
    × GetDifficultyDamageScaleEnemy()  // multiplayer: 1 / (1 + (n-1) × 0.30)
    × m_playerDamageRate               // combat difficulty: 0.7 – 1.25
```

All multiplications. No additions between different modifier categories.

---

## Key Takeaway

Every damage modifier in Valheim's pipeline is applied via `DamageTypes.Modify(float)` or `HitData.ApplyModifier(float)`, both of which **multiply** all damage fields by the given scalar. There is no addition-based stacking anywhere in the damage pipeline. All modifiers — star level, combat difficulty, multiplayer scaling, weapon multipliers — are **multiplicative** with each other.
