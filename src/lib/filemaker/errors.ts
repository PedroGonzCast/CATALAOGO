const FM_ERROR_MESSAGES: Record<string, string> = {
  '0': 'No error',
  '1': 'User cancelled action',
  '2': 'Memory error',
  '3': 'Command not available',
  '4': 'Command unknown',
  '5': 'Command invalid (for example, a Set Field script step does not have a calculation specified)',
  '6': 'File readonly',
  '9': 'Insufficient privileges',
  '100': 'File is missing',
  '212': 'Invalid user account or password',
  '401': 'No records match the request',
  '500': 'Date value does not meet validation entry options',
  '501': 'Time value does not meet validation entry options',
  '502': 'Number value does not meet validation entry options',
  '503': 'Value in field is not within the range specified in validation entry options',
  '504': 'Value in field fails four-digit year format test',
  '505': 'Invalid date value',
  '506': 'Invalid time value',
  '507': 'Invalid date/time value',
  '508': 'Invalid value in field',
  '509': 'Field requires a valid value',
  '510': 'Related value is empty or unavailable',
  '511': 'Value in field exceeds maximum field size',
  '512': 'Record was already modified by another user',
  '513': 'Record must have a unique value for this field',
  '706': 'EPS file has no preview image',
  '707': 'Graphic translator cannot be found',
  '708': 'Can\'t import file or need color monitor support to import file',
  '709': 'QuickTime movie import failed',
  '710': 'Unable to update QuickTime file reference because the database file is read only',
  '711': 'Import translator cannot be found',
  '714': 'Password privileges do not allow the operation',
  '715': 'Specified Excel worksheet or named range is missing',
  '716': 'A SQL query using DELETE, INSERT, or UPDATE is not allowed for ODBC import',
  '717': 'There is not enough XML/XSL information to proceed with the import or export',
  '718': 'Error in parsing XML file (from FileMaker SAX parser)',
  '719': 'Error in transforming XML using XSL (from Xalan)',
  '720': 'Error exporting; intended format does not support repeating fields',
  '721': 'Unknown error occurred in the parser or the transformer',
  '722': 'Cannot import data into a file that has no fields',
  '723': 'You do not have permission to add records to or modify records in the target table',
  '724': 'You do not have permission to delete records in the target table',
  '725': 'All records were imported but the last action could not be performed because of an error',
  '726': 'There are more records in the import file than in the target table; not all records were imported',
  '727': 'There are more records in the target table than in the import file; not all records were updated',
  '729': 'Errors occurred during import; records could not be imported',
  '730': 'Unsupported Excel version. (Convert file to Excel 7.0 (Excel 95), Excel 97, 2000, or XP format and try again)',
  '731': 'The file you are importing from contains no data',
  '732': 'This file cannot be inserted because it contains other files',
  '733': 'A table cannot be imported into itself',
  '734': 'This file type cannot be displayed as a picture',
  '735': 'This file type cannot be displayed as a picture. It will be inserted and displayed as a file',
  '736': 'Too much data to export to this format. It will be truncated',
  '737': 'Bento table you are importing is no longer available. Please upgrade your Bento data',
  '800': 'Unable to create file on disk',
  '801': 'Unable to create temporary file on System disk',
  '802': 'Unable to open file',
  '803': 'File is single user or host cannot be found',
  '804': 'File cannot be opened with read-only access',
  '805': 'File is damaged; use Recover command',
  '806': 'File cannot be opened with this version of FileMaker Pro',
  '807': 'File is not a FileMaker Pro file or is severely damaged',
  '808': 'Cannot open file because access privileges are damaged',
  '809': 'Disk/volume is full',
  '810': 'Disk/volume is locked',
  '811': 'Temporary file cannot be opened as FileMaker Pro file',
  '813': 'Record Synchronization error on network',
  '814': 'File(s) cannot be opened because maximum number is open',
  '815': 'Couldn\'t open lookup file',
  '816': 'Unable to convert file',
  '817': 'Unable to open file because it does not belong to this solution',
  '819': 'Cannot save a local copy of a remote file',
  '820': 'File is in the process of being closed',
  '821': 'Host forced a disconnect',
  '822': 'FMI files not found; reinstall missing files',
  '823': 'Cannot set file to single-user, guests are connected',
  '824': 'File is damaged or not a FileMaker file',
  '900': 'General spelling engine error',
  '901': 'Main spelling dictionary not installed',
  '902': 'Could not launch the Help system',
  '903': 'Command cannot be used in a shared file',
  '905': 'No active field selected; must be in a field to use spelling commands',
  '906': 'Current file is not shared; command can be used only if the file is shared',
  '920': 'Can\'t initialize the spelling engine',
  '921': 'User dictionary cannot be loaded for editing',
  '922': 'User dictionary cannot be found',
  '923': 'User dictionary is read-only',
  '951': 'An unexpected error occurred (*)',
  '953': 'Unsupported XML grammar (*)',
  '954': 'No XML data available (*)',
  '955': 'Required XML object is missing (*)',
  '956': 'Invalid number of XML records requested (*)',
  '957': 'XML data too large to process (*)',
  '958': 'Couldn\'t decrypt data (*)',
  '959': 'Unexpected Data Received (*)',
  '960': 'Parameter Missing (*)',
};

export class FileMakerError extends Error {
  readonly code: string;
  readonly fmMessage: string; // mensaje oficial de FM (puede diferir del message)

  constructor(message: string, code: string) {
    const knownMessage = FM_ERROR_MESSAGES[code];
    // Usar el mensaje personalizado si es más descriptivo que el código FM genérico.
    // Si el código es desconocido (sin entrada en la tabla), usar el mensaje que llega.
    super(knownMessage ?? message);
    this.name = 'FileMakerError';
    this.code = code;
    this.fmMessage = knownMessage ?? message;
  }

  isNotFound(): boolean {
    return this.code === '401';
  }

  isAuthError(): boolean {
    return this.code === '212';
  }

  isValidationError(): boolean {
    const code = Number(this.code);
    return code >= 500 && code <= 513;
  }

  isDuplicateError(): boolean {
    return this.code === '513';
  }
}

export function parseFMError(error: unknown): FileMakerError {
  if (error instanceof FileMakerError) return error;
  if (error instanceof Error) return new FileMakerError(error.message, '999');
  return new FileMakerError('Unknown error', '999');
}
