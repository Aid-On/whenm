/**
 * Central schema definitions for WhenM
 * 
 * Single source of truth for verb-fluent mappings and domain vocabulary
 */

/**
 * Core mapping from event verbs to fluents they initiate
 */
export const VERB_TO_FLUENT_MAP: Record<string, string> = {
  // Role/Position changes
  'became': 'role',
  'promoted': 'role',
  'hired': 'employed_at',
  'appointed': 'role',
  
  // Knowledge acquisition
  'learned': 'knows',
  'studied': 'knows',
  'mastered': 'knows',
  'forgot': 'knows', // special: terminates
  
  // Location changes
  'moved': 'lives_in',
  'relocated': 'lives_in',
  'visited': 'visited',
  'arrived': 'at',
  'left': 'at', // special: terminates
  
  // Membership
  'joined': 'member_of',
  'enrolled': 'member_of',
  'quit': 'member_of', // special: terminates
  
  // Ownership
  'acquired': 'owns',
  'bought': 'owns',
  'received': 'has',
  'obtained': 'has',
  'sold': 'owns', // special: terminates
  'lost': 'has', // special: terminates
  
  // Equipment
  'equipped': 'has',
  'wielded': 'wielding',
  'wore': 'wearing',
  
  // Relationships
  'married': 'married_to',
  'befriended': 'friends_with',
  'met': 'knows_person',
  
  // Skills/Certifications
  'certified': 'certified_in',
  'qualified': 'qualified_for',
  'trained': 'trained_in'
};

/**
 * Property to verb mappings (for Entity API)
 * Maps property names to appropriate verbs for natural language generation
 */
export const PROPERTY_TO_VERB_MAP: Record<string, string> = {
  // Job/Role related
  'role': 'became',
  'job': 'became',
  'position': 'became',
  'title': 'became',
  
  // Location related
  'location': 'moved to',
  'city': 'moved to',
  'address': 'moved to',
  'country': 'moved to',
  
  // Knowledge/Skills
  'skills': 'learned',
  'knowledge': 'learned',
  'expertise': 'mastered',
  'certification': 'earned',
  
  // Membership
  'team': 'joined',
  'company': 'joined',
  'organization': 'joined',
  'club': 'joined',
  'project': 'started',
  
  // Possession
  'items': 'acquired',
  'equipment': 'equipped',
  'tools': 'obtained'
};

/**
 * Property to fluent mappings (for queries)
 * Maps user-friendly property names to internal fluent names
 */
export const PROPERTY_TO_FLUENT_MAP: Record<string, string> = {
  // Knowledge variants
  'skills': 'knows',
  'knowledge': 'knows',
  'expertise': 'knows',
  
  // Location variants
  'location': 'lives_in',
  'city': 'lives_in',
  'address': 'lives_in',
  'residence': 'lives_in',
  
  // Team/Organization variants
  'team': 'member_of',
  'group': 'member_of',
  'club': 'member_of',
  'organization': 'member_of',
  
  // Employment variants
  'company': 'employed_at',
  'employer': 'employed_at',
  'workplace': 'employed_at',
  
  // Role variants (all map to 'role')
  'job': 'role',
  'position': 'role',
  'title': 'role',
  'occupation': 'role'
};

/**
 * Fluent terminator mappings
 * Maps verbs to the fluents they terminate
 */
export const VERB_TERMINATES: Record<string, string> = {
  'quit': 'member_of',
  'left': 'member_of',
  'resigned': 'employed_at',
  'fired': 'employed_at',
  'sold': 'owns',
  'lost': 'has',
  'forgot': 'knows',
  'divorced': 'married_to',
  'died': '*' // special: terminates all fluents
};

/**
 * Fluent singularity rules
 * These fluents can only have one value at a time
 */
export const SINGULAR_FLUENTS = new Set([
  'role',
  'lives_in',
  'employed_at',
  'married_to',
  'wearing',
  'wielding'
]);

/**
 * Default fluents to query when getting entity state
 * These are the standard fluents that Entity.get() retrieves
 */
export const DEFAULT_FLUENTS = new Set([
  'role',
  'knows',
  'lives_in',
  'member_of',
  'employed_at',
  'has'
]);

/**
 * Preferred property names for fluents (fluent -> property reverse mapping)
 * Used when mapping fluent values back to property names in Entity.get()
 */
export const FLUENT_TO_PREFERRED_PROPERTY: Record<string, string> = {
  'role': 'role',           // Prefer 'role' over 'job', 'position', 'title', 'occupation'
  'lives_in': 'location',   // Prefer 'location' over 'city', 'address', 'residence'
  'knows': 'knows',         // For knowledge/skills
  'member_of': 'team',      // Prefer 'team' over 'group', 'club', 'organization'
  'employed_at': 'company', // Prefer 'company' over 'employer', 'workplace'
  'has': 'has'              // Generic possession
};

/**
 * Synonym groups for natural language queries
 * Used in askWhat() to find relevant fluents based on question keywords
 */
export const FLUENT_SYNONYM_GROUPS: Record<string, string[]> = {
  'job': ['role', 'job', 'position', 'title', 'employed_at', 'works_at', 'occupation'],
  'skill': ['knows', 'skills', 'expertise', 'learned', 'knowledge'],
  'location': ['lives_in', 'location', 'city', 'address', 'residence'],
  'team': ['member_of', 'team', 'group', 'club', 'organization']
};

/**
 * Get all fluent synonyms for a concept
 */
export function getFluentSynonyms(concept: string): string[] {
  return FLUENT_SYNONYM_GROUPS[concept] || [];
}

/**
 * Natural language verb categories
 */
export const VERB_CATEGORIES = {
  transitive: new Set([
    'learned', 'became', 'joined', 'bought', 'sold', 
    'created', 'built', 'made', 'wrote', 'acquired',
    'mastered', 'studied', 'earned', 'equipped', 'obtained',
    'hired', 'promoted', 'appointed', 'married', 'befriended'
  ]),
  
  intransitive: new Set([
    'quit', 'died', 'arrived', 'left', 'slept', 
    'woke', 'retired', 'resigned', 'graduated', 'succeeded',
    'failed', 'won', 'lost', 'started', 'stopped'
  ]),
  
  motion: new Set([
    'moved', 'relocated', 'visited', 'traveled',
    'arrived', 'departed', 'returned', 'migrated'
  ]),
  
  cognitive: new Set([
    'learned', 'forgot', 'remembered', 'understood',
    'realized', 'discovered', 'studied', 'mastered'
  ])
};

/**
 * Domain-specific vocabulary extensions
 * Can be merged with defaults for specialized applications
 */
export interface DomainVocabulary {
  verbToFluent?: Record<string, string>;
  propertyToVerb?: Record<string, string>;
  propertyToFluent?: Record<string, string>;
  verbTerminates?: Record<string, string>;
  singularFluents?: string[];
  verbCategories?: Record<string, string[]>;
}

/**
 * Medical domain example
 */
export const MEDICAL_DOMAIN: DomainVocabulary = {
  verbToFluent: {
    'diagnosed': 'has_diagnosis',
    'treated': 'receiving_treatment',
    'prescribed': 'taking_medication',
    'recovered': 'health_status',
    'developed': 'has_symptom'
  },
  propertyToVerb: {
    'diagnosis': 'diagnosed with',
    'medication': 'prescribed',
    'symptom': 'developed',
    'treatment': 'started'
  },
  propertyToFluent: {
    'diagnosis': 'has_diagnosis',
    'medication': 'taking_medication',
    'symptom': 'has_symptom',
    'condition': 'has_condition'
  }
};

/**
 * Education domain example
 */
export const EDUCATION_DOMAIN: DomainVocabulary = {
  verbToFluent: {
    'enrolled': 'studying',
    'graduated': 'graduated_from',
    'completed': 'completed_course',
    'failed': 'failed_course',
    'passed': 'passed_exam'
  },
  propertyToVerb: {
    'course': 'enrolled in',
    'degree': 'pursuing',
    'grade': 'received',
    'university': 'attending'
  },
  propertyToFluent: {
    'course': 'studying',
    'grade': 'has_grade',
    'gpa': 'has_gpa',
    'major': 'majoring_in'
  }
};

/**
 * Merge domain vocabulary with defaults
 */
export function mergeDomainVocabulary(
  domain: DomainVocabulary
): {
  verbToFluent: Record<string, string>;
  propertyToVerb: Record<string, string>;
  propertyToFluent: Record<string, string>;
  verbTerminates: Record<string, string>;
  singularFluents: Set<string>;
} {
  return {
    verbToFluent: {
      ...VERB_TO_FLUENT_MAP,
      ...domain.verbToFluent
    },
    propertyToVerb: {
      ...PROPERTY_TO_VERB_MAP,
      ...domain.propertyToVerb
    },
    propertyToFluent: {
      ...PROPERTY_TO_FLUENT_MAP,
      ...domain.propertyToFluent
    },
    verbTerminates: {
      ...VERB_TERMINATES,
      ...domain.verbTerminates
    },
    singularFluents: new Set([
      ...SINGULAR_FLUENTS,
      ...(domain.singularFluents || [])
    ])
  };
}

/**
 * Helper to get fluent from verb
 */
export function getFluentForVerb(verb: string, customMappings?: Record<string, string>): string | undefined {
  const mappings = customMappings ? { ...VERB_TO_FLUENT_MAP, ...customMappings } : VERB_TO_FLUENT_MAP;
  return mappings[verb.toLowerCase()];
}

/**
 * Helper to get verb from property
 */
export function getVerbForProperty(property: string, customMappings?: Record<string, string>): string {
  const mappings = customMappings ? { ...PROPERTY_TO_VERB_MAP, ...customMappings } : PROPERTY_TO_VERB_MAP;
  return mappings[property.toLowerCase()] || 'set';
}

/**
 * Helper to get fluent from property
 */
export function getFluentForProperty(property: string, customMappings?: Record<string, string>): string {
  const mappings = customMappings ? { ...PROPERTY_TO_FLUENT_MAP, ...customMappings } : PROPERTY_TO_FLUENT_MAP;
  return mappings[property.toLowerCase()] || property.toLowerCase();
}

/**
 * Check if a fluent is singular (can only have one value)
 */
export function isFluentSingular(fluent: string, customSingulars?: Set<string>): boolean {
  const singulars = customSingulars || SINGULAR_FLUENTS;
  return singulars.has(fluent);
}

/**
 * Check if a verb is transitive
 */
export function isVerbTransitive(verb: string): boolean {
  return VERB_CATEGORIES.transitive.has(verb.toLowerCase());
}

/**
 * Check if a verb is intransitive
 */
export function isVerbIntransitive(verb: string): boolean {
  return VERB_CATEGORIES.intransitive.has(verb.toLowerCase());
}

/**
 * Get terminated fluent for a verb
 */
export function getTerminatedFluent(verb: string, customTerminates?: Record<string, string>): string | undefined {
  const terminates = customTerminates ? { ...VERB_TERMINATES, ...customTerminates } : VERB_TERMINATES;
  return terminates[verb.toLowerCase()];
}