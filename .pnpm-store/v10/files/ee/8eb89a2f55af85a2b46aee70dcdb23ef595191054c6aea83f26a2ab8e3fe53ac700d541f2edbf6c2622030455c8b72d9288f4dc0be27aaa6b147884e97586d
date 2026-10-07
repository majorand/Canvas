"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToDataType = exports.ModuleKind = exports.DependencyKind = void 0;
var DependencyKind;
(function (DependencyKind) {
    DependencyKind[DependencyKind["Unknown"] = 0] = "Unknown";
    DependencyKind[DependencyKind["ImportStatement"] = 1] = "ImportStatement";
    DependencyKind[DependencyKind["DynamicImport"] = 2] = "DynamicImport";
    DependencyKind[DependencyKind["RequireCall"] = 3] = "RequireCall";
    DependencyKind[DependencyKind["AMDRequire"] = 4] = "AMDRequire";
})(DependencyKind || (exports.DependencyKind = DependencyKind = {}));
/** Module type */
var ModuleKind;
(function (ModuleKind) {
    /** Normal module */
    ModuleKind[ModuleKind["Normal"] = 0] = "Normal";
    /** Aggregation module */
    ModuleKind[ModuleKind["Concatenation"] = 1] = "Concatenation";
})(ModuleKind || (exports.ModuleKind = ModuleKind = {}));
var ToDataType;
(function (ToDataType) {
    ToDataType[ToDataType["NoCode"] = 0] = "NoCode";
    /** Normal mode */
    ToDataType[ToDataType["Normal"] = 1] = "Normal";
    /** Lite mode: no source code */
    ToDataType[ToDataType["NoSource"] = 2] = "NoSource";
    /** Lite & No Assets Code mode */
    ToDataType[ToDataType["NoSourceAndAssets"] = 3] = "NoSourceAndAssets";
    /** All Data, include module transformed data. */
    ToDataType[ToDataType["All"] = 4] = "All";
})(ToDataType || (exports.ToDataType = ToDataType = {}));
