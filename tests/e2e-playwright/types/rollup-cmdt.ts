export interface RollupCMDT {
  DeveloperName: string;
  MasterLabel: string;
  RollupFieldOnCalcItem__c: string;
  RollupOperation__c: 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'AVG' | 'CONCAT' | 'CONCAT_DISTINCT';
  RollupFieldOnLookupObject__c: string;
  LookupObject__c: string;
  CalcItem__c: string;
  GrandparentRelationshipFieldPath__c?: string;
  RollupToUltimateParent__c?: boolean;
  [key: string]: any;
}
