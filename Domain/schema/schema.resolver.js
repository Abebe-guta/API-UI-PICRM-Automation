// domain/schema/schema.resolver.js
import { normalizeSchema } from './schema.normalizer.js';

// -----------------------------
// SCHEMA RESOLVER
// -----------------------------
export class SchemaResolver {
  constructor(columns = [],    {
      schemaVersion = null,
      onSchemaChange = null
    } = {}) {
      //Validate input
    if (!Array.isArray(columns)) {
      throw new Error('❌ Schema must be an array');
    }
      //Store raw state
    this.rawColumns = columns;
    this.schemaVersion = schemaVersion;
    this.onSchemaChange = onSchemaChange;

    // Normalize schema (clean schema)
    this.columns = normalizeSchema(columns);

    // Safety Guard (kept as-is)
    if (this.columns.length === 0) {
      throw new Error('❌ No valid columns after normalization');
    }
    //deterministic fingerprint for change detection
    this.fingerprint = this.buildFingerprint(this.columns);
  }   
     // Build fingerprint (Creates a unique signature of the schema)
     /*"Think of it like":“If two schemas produce the same fingerprint → they are structurally the same (at least for name + type)*/
  buildFingerprint(columns ) {
 return columns
 .map(c => `${c.name}:${c.type}`)
  .sort()
 .join('|');
  }
    // -----------------------------
  // SCHEMA DRIFT DETECTION
  // -----------------------------
  detectChange(previousFingerprint) {
    if (!previousFingerprint) return false; // No previous state to compare
    const changed=previousFingerprint !== this.fingerprint;
    if (changed) {
      console.warn('⚠️ Schema change detected!');
      this.onSchemaChange?.({ 
        type: 'SCHEMA_CHANGED',
        schemaVersion: this.schemaVersion,
        previous: previousFingerprint,
        current: this.fingerprint,
        timestamp: new Date().toISOString()
      });
    }  
    return changed;

  }
  // -----------------------------
  // BASE SAFE SET
  // -----------------------------
  getUsableColumns() {
    return[...this.columns]; //Returns a copy, [Why?:Prevents external mutation].
  }

  // -----------------------------
  // TYPE FILTERS
  // -----------------------------
  getNameSet() {
    return new Set(this.columns.map(c => c.name));
  }
  getNumeric() {
    return this.columns.filter(c => c.type === 'numeric');
  }

  getCategorical() {
    return this.columns.filter(c => c.type === 'categorical');
  }

  getDate() {
    return this.columns.filter(c => c.type === 'date');
  }

  // -----------------------------
  // SEGMENT READY SET
  // -----------------------------
  getSegmentReadyColumns() {
    return this.columns;
  }

  // -----------------------------
  // DEBUG / OBSERVABILITY
  // -----------------------------
  getStats() {
    return {
      schema_version: this.schemaVersion,
      fingerPrint:this.fingerprint,
      total_raw: this.rawColumns.length,
      total_valid: this.columns.length,
      numeric: this.getNumeric().length,
      categorical: this.getCategorical().length,
      date: this.getDate().length
    };
  }
}