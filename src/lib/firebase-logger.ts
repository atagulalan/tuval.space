import {
  DocumentReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot,
  onSnapshot as firebaseOnSnapshot,
  getDoc as firebaseGetDoc,
  getDocs as firebaseGetDocs,
  Unsubscribe,
  DocumentData,
} from 'firebase/firestore';
import { logger } from './logger';

const firebaseLogger = logger('firebase');

/**
 * Extract path from DocumentReference or Query
 */
const getPath = (ref: DocumentReference | Query): string => {
  if ('path' in ref) {
    // DocumentReference
    return ref.path;
  } else {
    // Query - try to get path from parent CollectionReference
    // Query doesn't expose path directly, so we'll use a workaround
    try {
      // Try to access parent property (CollectionReference has path)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parent = (ref as any).parent;
      if (parent && 'path' in parent) {
        return parent.path;
      }
    } catch {
      // Fallback to string parsing
    }

    // Fallback: extract from query string representation
    try {
      const queryStr = ref.toString();
      // Try multiple patterns to extract collection path
      // Pattern 1: CollectionReference path (e.g., "CollectionReference(boards)")
      const collectionMatch = queryStr.match(/CollectionReference\(([^)]+)\)/);
      if (collectionMatch) {
        return collectionMatch[1];
      }

      // Pattern 2: Query path (e.g., "Query(boards/123/dense_modifications)")
      const queryMatch = queryStr.match(/Query\(([^)]+)\)/);
      if (queryMatch) {
        return queryMatch[1];
      }

      // Pattern 3: Extract path from string (e.g., "boards/123/dense_modifications")
      const pathMatch = queryStr.match(/(\/[^/\s]+(?:\/[^/\s]+)*)/);
      if (pathMatch) {
        return pathMatch[1].replace(/^\//, ''); // Remove leading slash
      }
    } catch {
      // If all parsing fails
    }

    return 'unknown';
  }
};

/**
 * Extract query details from Query object
 */
const getQueryDetails = (query: Query): string => {
  const parts: string[] = [];
  // Query object doesn't expose its constraints directly
  // We'll use toString() and parse what we can
  try {
    const queryStr = query.toString();

    // Firestore query toString() format examples:
    // - Query(CollectionReference(users), where(username, ==, value))
    // - Query(CollectionReference(boards), where(isPublic, ==, true), orderBy(createdAt, desc))

    // Pattern 1: where clauses - match "where(field, operator, value)"
    // More flexible pattern to catch various formats
    const wherePatterns = [
      /where\(([^,)]+),\s*([^,)]+),\s*([^)]+)\)/g, // where(field, op, value)
      /where\(([^)]+)\)/g, // where(...) - fallback
    ];

    for (const pattern of wherePatterns) {
      const whereMatches = queryStr.matchAll(pattern);
      for (const match of whereMatches) {
        if (match.length >= 4) {
          // Format: where(field, operator, value)
          const field = match[1].trim();
          const operator = match[2].trim();
          const value = match[3].trim();
          // Clean up value if it's a string representation
          const cleanValue = value.replace(/^['"]|['"]$/g, '');
          parts.push(`where(${field} ${operator} ${cleanValue})`);
        } else if (match.length >= 2) {
          // Fallback: just show the whole where clause
          parts.push(`where(${match[1]})`);
        }
      }
    }

    // Pattern 2: orderBy with field and direction
    const orderByMatches = queryStr.matchAll(
      /orderBy\(([^,)]+)(?:,\s*([^)]+))?\)/g
    );
    for (const match of orderByMatches) {
      const field = match[1].trim();
      const direction = match[2]?.trim() || 'asc';
      parts.push(`orderBy(${field}, ${direction})`);
    }

    // Pattern 3: limit
    const limitMatches = queryStr.matchAll(/limit\((\d+)\)/g);
    for (const match of limitMatches) {
      parts.push(`limit(${match[1]})`);
    }

    // Pattern 4: startAt/startAfter/endAt/endBefore
    if (queryStr.includes('startAt')) {
      parts.push('startAt(...)');
    }
    if (queryStr.includes('startAfter')) {
      parts.push('startAfter(...)');
    }
    if (queryStr.includes('endAt')) {
      parts.push('endAt(...)');
    }
    if (queryStr.includes('endBefore')) {
      parts.push('endBefore(...)');
    }
  } catch (error) {
    // If parsing fails, return a generic message
    return 'unable to parse constraints';
  }

  if (parts.length === 0) {
    return 'no constraints';
  }

  return parts.join(', ');
};

/**
 * Estimate data size in bytes (rough approximation)
 */
const estimateDataSize = (
  snapshot: DocumentSnapshot | QuerySnapshot
): number => {
  if ('docs' in snapshot) {
    // QuerySnapshot
    return snapshot.docs.reduce((total, doc) => {
      const data = doc.data();
      return total + JSON.stringify(data).length;
    }, 0);
  } else {
    // DocumentSnapshot
    const data = snapshot.data();
    return data ? JSON.stringify(data).length : 0;
  }
};

/**
 * Wrapped getDoc with logging
 */
export const getDoc = async <T = DocumentData>(
  documentRef: DocumentReference<T>
): Promise<DocumentSnapshot<T>> => {
  const startTime = performance.now();
  const path = getPath(documentRef as DocumentReference<DocumentData>);

  firebaseLogger.log(`[getDoc] Starting: ${path}`);

  try {
    const snapshot = await firebaseGetDoc(
      documentRef as DocumentReference<DocumentData>
    );
    const duration = performance.now() - startTime;
    const exists = snapshot.exists();
    const size = exists
      ? estimateDataSize(snapshot as DocumentSnapshot<DocumentData>)
      : 0;

    firebaseLogger.log(
      `[getDoc] ${path} | Duration: ${duration.toFixed(2)}ms | Exists: ${exists} | Size: ${size} bytes`
    );

    return snapshot as DocumentSnapshot<T>;
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    firebaseLogger.error(
      `[getDoc] ${path} | Duration: ${duration.toFixed(2)}ms | Error: ${errorMessage}`,
      error
    );

    throw error;
  }
};

/**
 * Wrapped getDocs with logging
 */
export const getDocs = async <T = DocumentData>(
  query: Query<T>
): Promise<QuerySnapshot<T>> => {
  const startTime = performance.now();
  const path = getPath(query as Query<DocumentData>);
  const queryDetails = getQueryDetails(query as Query<DocumentData>);

  firebaseLogger.log(`[getDocs] Starting: ${path} | Query: ${queryDetails}`);

  try {
    const snapshot = await firebaseGetDocs(query as Query<DocumentData>);
    const duration = performance.now() - startTime;
    const docCount = snapshot.docs.length;
    const size = estimateDataSize(snapshot as QuerySnapshot<DocumentData>);

    firebaseLogger.log(
      `[getDocs] ${path} | Query: ${queryDetails} | Duration: ${duration.toFixed(2)}ms | Docs: ${docCount} | Size: ${size} bytes`
    );

    return snapshot as QuerySnapshot<T>;
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    firebaseLogger.error(
      `[getDocs] ${path} | Query: ${queryDetails} | Duration: ${duration.toFixed(2)}ms | Error: ${errorMessage}`,
      error
    );

    throw error;
  }
};

/**
 * Wrapped onSnapshot for DocumentReference with logging
 */
export function onSnapshot<T = DocumentData>(
  reference: DocumentReference<T>,
  onNext: (snapshot: DocumentSnapshot<T>) => void,
  onError?: (error: Error) => void
): Unsubscribe;
/**
 * Wrapped onSnapshot for Query with logging
 */
export function onSnapshot<T = DocumentData>(
  reference: Query<T>,
  onNext: (snapshot: QuerySnapshot<T>) => void,
  onError?: (error: Error) => void
): Unsubscribe;
/**
 * Wrapped onSnapshot implementation
 */
export function onSnapshot<T = DocumentData>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reference: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNext: any,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = getPath(
    reference as DocumentReference<DocumentData> | Query<DocumentData>
  );
  const isQuery = !('path' in reference);
  const queryDetails = isQuery
    ? getQueryDetails(reference as Query<DocumentData>)
    : undefined;

  firebaseLogger.log(
    `[onSnapshot] Setting up listener: ${path}${queryDetails ? ` | Query: ${queryDetails}` : ''}`
  );

  let initialSnapshotReceived = false;
  const startTime = performance.now();

  const wrappedOnNext = (
    snapshot: DocumentSnapshot<DocumentData> | QuerySnapshot<DocumentData>
  ) => {
    if (!initialSnapshotReceived) {
      initialSnapshotReceived = true;
      const initialDuration = performance.now() - startTime;

      if ('docs' in snapshot) {
        // QuerySnapshot
        const docCount = snapshot.docs.length;
        const size = estimateDataSize(snapshot);
        firebaseLogger.log(
          `[onSnapshot] ${path} | Query: ${queryDetails} | Initial snapshot: ${docCount} docs | Duration: ${initialDuration.toFixed(2)}ms | Size: ${size} bytes`
        );
        // Type assertion: we know this is QuerySnapshot when 'docs' exists
        onNext(snapshot as QuerySnapshot<T>);
      } else {
        // DocumentSnapshot
        const exists = snapshot.exists();
        const size = exists ? estimateDataSize(snapshot) : 0;
        firebaseLogger.log(
          `[onSnapshot] ${path} | Initial snapshot | Exists: ${exists} | Duration: ${initialDuration.toFixed(2)}ms | Size: ${size} bytes`
        );
        // Type assertion: we know this is DocumentSnapshot when 'docs' doesn't exist
        onNext(snapshot as DocumentSnapshot<T>);
      }
    } else {
      // Subsequent updates
      if ('docs' in snapshot) {
        const docCount = snapshot.docs.length;
        const changeCount = snapshot.docChanges().length;
        firebaseLogger.log(
          `[onSnapshot] ${path} | Update: ${changeCount} changes | Total docs: ${docCount}`
        );
        onNext(snapshot as QuerySnapshot<T>);
      } else {
        const exists = snapshot.exists();
        firebaseLogger.log(`[onSnapshot] ${path} | Update | Exists: ${exists}`);
        onNext(snapshot as DocumentSnapshot<T>);
      }
    }
  };

  const wrappedOnError = (error: Error) => {
    firebaseLogger.error(
      `[onSnapshot] ${path}${queryDetails ? ` | Query: ${queryDetails}` : ''} | Error:`,
      error
    );

    if (onError) {
      onError(error);
    }
  };

  // Use type guard to call the correct overload
  let unsubscribe: Unsubscribe;
  if ('path' in reference) {
    // DocumentReference
    unsubscribe = firebaseOnSnapshot(
      reference as DocumentReference<DocumentData>,
      wrappedOnNext as (snapshot: DocumentSnapshot<DocumentData>) => void,
      wrappedOnError
    );
  } else {
    // Query
    unsubscribe = firebaseOnSnapshot(
      reference as Query<DocumentData>,
      wrappedOnNext as (snapshot: QuerySnapshot<DocumentData>) => void,
      wrappedOnError
    );
  }

  // Return wrapped unsubscribe that logs
  return () => {
    firebaseLogger.log(`[onSnapshot] Unsubscribing: ${path}`);
    unsubscribe();
  };
}
