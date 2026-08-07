// entities.csv의 parentageIds 데이터 기반 관계 목록
export const relationshipsData = [
  // Zeus의 부모
  { parent: 'entity_kronos_001', child: 'entity_zeus_001' },
  { parent: 'entity_rhea_001', child: 'entity_zeus_001' },

  // Zeus의 자식들
  { parent: 'entity_zeus_001', child: 'entity_athena_001' },
  { parent: 'entity_zeus_001', child: 'entity_apollo_001' },
  { parent: 'entity_zeus_001', child: 'entity_artemis_001' },
  { parent: 'entity_zeus_001', child: 'entity_ares_001' },
  { parent: 'entity_zeus_001', child: 'entity_aphrodite_001' },
  { parent: 'entity_zeus_001', child: 'entity_hermes_001' },
  { parent: 'entity_zeus_001', child: 'entity_dionysus_001' },
  { parent: 'entity_zeus_001', child: 'entity_heracles_001' },

  // Hera의 자식들
  { parent: 'entity_hera_001', child: 'entity_ares_001' },
  { parent: 'entity_hera_001', child: 'entity_hephaestus_001' },
  { parent: 'entity_hera_001', child: 'entity_hebe_001' },

  // Poseidon의 자식들
  { parent: 'entity_poseidon_001', child: 'entity_triton_001' },
  { parent: 'entity_poseidon_001', child: 'entity_polyphemus_001' },

  // Kronos의 자식들
  { parent: 'entity_kronos_001', child: 'entity_hera_001' },
  { parent: 'entity_kronos_001', child: 'entity_poseidon_001' },
  { parent: 'entity_kronos_001', child: 'entity_hades_001' },
  { parent: 'entity_kronos_001', child: 'entity_demeter_001' },
  { parent: 'entity_kronos_001', child: 'entity_hestia_001' },

  // Rhea의 자식들
  { parent: 'entity_rhea_001', child: 'entity_hera_001' },
  { parent: 'entity_rhea_001', child: 'entity_poseidon_001' },
  { parent: 'entity_rhea_001', child: 'entity_hades_001' },
  { parent: 'entity_rhea_001', child: 'entity_demeter_001' },
  { parent: 'entity_rhea_001', child: 'entity_hestia_001' },

  // Demeter의 자식
  { parent: 'entity_demeter_001', child: 'entity_persephone_001' },

  // Leto의 자식들
  { parent: 'entity_leto_001', child: 'entity_apollo_001' },
  { parent: 'entity_leto_001', child: 'entity_artemis_001' },

  // Maia의 자식
  { parent: 'entity_maia_001', child: 'entity_hermes_001' },

  // Heracles의 부모
  { parent: 'entity_zeus_001', child: 'entity_heracles_001' },
  { parent: 'entity_alcmene_001', child: 'entity_heracles_001' },

  // Perseus의 부모
  { parent: 'entity_zeus_001', child: 'entity_perseus_001' },
  { parent: 'entity_danae_001', child: 'entity_perseus_001' },

  // Achilles의 부모
  { parent: 'entity_thetis_001', child: 'entity_achilles_001' },
  { parent: 'entity_peleus_001', child: 'entity_achilles_001' },

  // Hector의 부모
  { parent: 'entity_priam_001', child: 'entity_hector_001' },
  { parent: 'entity_hecuba_001', child: 'entity_hector_001' },

  // Aphrodite의 자식
  { parent: 'entity_aphrodite_001', child: 'entity_eros_001' },
  { parent: 'entity_aphrodite_001', child: 'entity_aeneas_001' },

  // Ouranos의 자식들
  { parent: 'entity_ouranos_001', child: 'entity_kronos_001' },
  { parent: 'entity_ouranos_001', child: 'entity_rhea_001' },

  // Gaia의 자식들
  { parent: 'entity_gaia_001', child: 'entity_kronos_001' },
  { parent: 'entity_gaia_001', child: 'entity_rhea_001' },

  // Ares와 Hera의 자식 (Harmonia)
  { parent: 'entity_ares_001', child: 'entity_harmonia_001' },
  { parent: 'entity_hera_001', child: 'entity_harmonia_001' },

  // Cerberus의 부모 (Typhon과 Echidna)
  { parent: 'entity_typhon_001', child: 'entity_cerberus_001' },
  { parent: 'entity_echidna_001', child: 'entity_cerberus_001' },

  // Minotaur의 부모 (Pasiphae와 Bull)
  { parent: 'entity_pasiphae_001', child: 'entity_minotaur_001' },

  // Pegasus의 부모 (Poseidon과 Medusa)
  { parent: 'entity_poseidon_001', child: 'entity_pegasus_001' },
  { parent: 'entity_medusa_001', child: 'entity_pegasus_001' },

  // Chimera의 부모 (Typhon과 Echidna)
  { parent: 'entity_typhon_001', child: 'entity_chimera_001' },
  { parent: 'entity_echidna_001', child: 'entity_chimera_001' },

  // Hydra의 부모 (Typhon과 Echidna)
  { parent: 'entity_typhon_001', child: 'entity_hydra_001' },
  { parent: 'entity_echidna_001', child: 'entity_hydra_001' },
];
