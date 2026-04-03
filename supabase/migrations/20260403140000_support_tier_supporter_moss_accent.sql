-- Align supporter tier accent with light-theme moss primary (#35654D), replacing legacy UI blue seed.
update speu.support_tiers
set
  accent_color = '#35654D',
  glow_rgb = '53, 101, 77'
where code = 'supporter'
  and accent_color in ('#4A7CB5', '#3D6B98');
