"use strict";
exports.ids = [
    "361"
];
exports.modules = {
    "./src/utils/profile.ts": function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            applyProfile: ()=>applyProfile
        });
        var node_fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("node:fs");
        var node_fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(node_fs__WEBPACK_IMPORTED_MODULE_0__);
        var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("node:path");
        var node_path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/ __webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_1__);
        var _rspack_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("@rspack/core");
        const defaultRustTraceLayer = "perfetto";
        async function applyProfile(filterValue, traceLayer = defaultRustTraceLayer, traceOutput) {
            const { asyncExitHook } = await Promise.resolve().then(__webpack_require__.bind(__webpack_require__, "exit-hook"));
            if ("logger" !== traceLayer && "perfetto" !== traceLayer) throw new Error(`unsupported trace layer: ${traceLayer}`);
            const timestamp = Date.now();
            const defaultOutputDir = node_path__WEBPACK_IMPORTED_MODULE_1___default().resolve(`.rspack-profile-${timestamp}-${process.pid}`);
            if (traceOutput) {
                if ("stdout" !== traceOutput && "stderr" !== traceOutput) traceOutput = node_path__WEBPACK_IMPORTED_MODULE_1___default().resolve(defaultOutputDir, traceOutput);
            } else {
                const defaultRustTracePerfettoOutput = node_path__WEBPACK_IMPORTED_MODULE_1___default().resolve(defaultOutputDir, "rspack.pftrace");
                const defaultRustTraceLoggerOutput = "stdout";
                const defaultTraceOutput = "perfetto" === traceLayer ? defaultRustTracePerfettoOutput : defaultRustTraceLoggerOutput;
                traceOutput = defaultTraceOutput;
            }
            await ensureFileDir(traceOutput);
            await _rspack_core__WEBPACK_IMPORTED_MODULE_2__.rspack.experiments.globalTrace.register(filterValue, traceLayer, traceOutput);
            asyncExitHook(_rspack_core__WEBPACK_IMPORTED_MODULE_2__.rspack.experiments.globalTrace.cleanup, {
                wait: 500
            });
        }
        async function ensureFileDir(outputFilePath) {
            const dir = node_path__WEBPACK_IMPORTED_MODULE_1___default().dirname(outputFilePath);
            await node_fs__WEBPACK_IMPORTED_MODULE_0___default().promises.mkdir(dir, {
                recursive: true
            });
        }
    }
};
