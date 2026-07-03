#!/usr/bin/env node
import { createRequire as __repoAgentCreateRequire } from "node:module";
const require = __repoAgentCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x2)(function(x2) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x2 + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit2(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit2.BREAK = BREAK;
    visit2.SKIP = SKIP;
    visit2.REMOVE = REMOVE;
    function visit_(key, node, visitor, path39) {
      const ctrl = callVisitor(key, node, visitor, path39);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path39, ctrl);
        return visit_(key, ctrl, visitor, path39);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path39 = Object.freeze(path39.concat(node));
          for (let i2 = 0; i2 < node.items.length; ++i2) {
            const ci = visit_(i2, node.items[i2], visitor, path39);
            if (typeof ci === "number")
              i2 = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i2, 1);
              i2 -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path39 = Object.freeze(path39.concat(node));
          const ck = visit_("key", node.key, visitor, path39);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path39);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path39) {
      const ctrl = await callVisitor(key, node, visitor, path39);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path39, ctrl);
        return visitAsync_(key, ctrl, visitor, path39);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path39 = Object.freeze(path39.concat(node));
          for (let i2 = 0; i2 < node.items.length; ++i2) {
            const ci = await visitAsync_(i2, node.items[i2], visitor, path39);
            if (typeof ci === "number")
              i2 = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i2, 1);
              i2 -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path39 = Object.freeze(path39.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path39);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path39);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path39) {
      if (typeof visitor === "function")
        return visitor(key, node, path39);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path39);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path39);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path39);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path39);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path39);
      return void 0;
    }
    function replaceNode(key, path39, node) {
      const parent = path39[path39.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit2;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit2 = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit2.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit2 = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit2.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i2 = 1; true; ++i2) {
        const name = `${prefix}${i2}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i2 = 0, len = val.length; i2 < len; ++i2) {
            const v0 = val[i2];
            const v1 = applyReviver(reviver, val, String(i2), v0);
            if (v1 === void 0)
              delete val[i2];
            else if (v1 !== v0)
              val[i2] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i2) => toJS(v, String(i2), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit2 = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit2.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match2 = tags.filter((t) => t.tag === tagName);
        const tagObj = match2.find((t) => !t.format) ?? match2[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path39, value) {
      let v = value;
      for (let i2 = path39.length - 1; i2 >= 0; --i2) {
        const k = path39[i2];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path39) => path39 == null || typeof path39 === "object" && !!path39[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path39, value) {
        if (isEmptyPath(path39))
          this.add(value);
        else {
          const [key, ...rest] = path39;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path39) {
        const [key, ...rest] = path39;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path39, keepScalar) {
        const [key, ...rest] = path39;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path39) {
        const [key, ...rest] = path39;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path39, value) {
        const [key, ...rest] = path39;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end2 = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end2 = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i2 = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i2 = consumeMoreIndentedLines(text, i2, indent.length);
        if (i2 !== -1)
          end2 = i2 + endStep;
      }
      for (let ch; ch = text[i2 += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i2;
          switch (text[i2 + 1]) {
            case "x":
              i2 += 3;
              break;
            case "u":
              i2 += 5;
              break;
            case "U":
              i2 += 9;
              break;
            default:
              i2 += 1;
          }
          escEnd = i2;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i2 = consumeMoreIndentedLines(text, i2, indent.length);
          end2 = i2 + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i2 + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i2;
          }
          if (i2 >= end2) {
            if (split) {
              folds.push(split);
              end2 = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i2 += 1];
                overflow = true;
              }
              const j = i2 > escEnd + 1 ? i2 - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end2 = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i3 = 0; i3 < folds.length; ++i3) {
        const fold = folds[i3];
        const end3 = folds[i3 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end3)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end3)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i2, indent) {
      let end2 = i2;
      let start2 = i2 + 1;
      let ch = text[start2];
      while (ch === " " || ch === "	") {
        if (i2 < start2 + indent) {
          ch = text[++i2];
        } else {
          do {
            ch = text[++i2];
          } while (ch && ch !== "\n");
          end2 = i2;
          start2 = i2 + 1;
          ch = text[start2];
        }
      }
      return end2;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i2 = 0, start2 = 0; i2 < strLen; ++i2) {
        if (str[i2] === "\n") {
          if (i2 - start2 > limit)
            return true;
          start2 = i2 + 1;
          if (strLen - start2 <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start2 = 0;
      for (let i2 = 0, ch = json[i2]; ch; ch = json[++i2]) {
        if (ch === " " && json[i2 + 1] === "\\" && json[i2 + 2] === "n") {
          str += json.slice(start2, i2) + "\\ ";
          i2 += 1;
          start2 = i2;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i2 + 1]) {
            case "u":
              {
                str += json.slice(start2, i2);
                const code = json.substr(i2 + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i2, 6);
                }
                i2 += 5;
                start2 = i2 + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i2 + 2] === '"' || json.length < minMultiLineLength) {
                i2 += 1;
              } else {
                str += json.slice(start2, i2) + "\n\n";
                while (json[i2 + 2] === "\\" && json[i2 + 3] === "n" && json[i2 + 4] !== '"') {
                  str += "\n";
                  i2 += 2;
                }
                str += indent;
                if (json[i2 + 2] === " ")
                  str += "\\";
                i2 += 1;
                start2 = i2 + 1;
              }
              break;
            default:
              i2 += 1;
          }
      }
      str = start2 ? str + json.slice(start2) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end2 = value.substring(endStart);
      const endNlPos = end2.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end2 || endNlPos !== end2.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end2) {
        value = value.slice(0, -end2.length);
        if (end2[end2.length - 1] === "\n")
          end2 = end2.slice(0, -1);
        end2 = end2.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start2 = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start2) {
        value = value.substring(start2.length);
        start2 = start2.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start2}${foldedValue}${end2}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start2}${value}${end2}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match2 = tags.filter((t) => t.tag === item.tag);
        if (match2.length > 0)
          return match2.find((t) => t.format === item.format) ?? match2[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match2 = tags.filter((t) => t.identify?.(obj));
        if (match2.length > 1) {
          const testMatch = match2.filter((t) => t.test);
          if (testMatch.length > 0)
            match2 = testMatch;
        }
        tagObj = match2.find((t) => t.format === item.format) ?? match2.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify2(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify2;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify2.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify2.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify2 = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify2.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify3 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify3(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i2 = 0; i2 < items.length; ++i2) {
        const item = items[i2];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify2.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i2 = 1; i2 < lines.length; ++i2) {
          const line = lines[i2];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i2 = 0; i2 < items.length; ++i2) {
        const item = items[i2];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify2.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i2 < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start: start2, end: end2 } = flowChars;
      if (lines.length === 0) {
        return start2 + end2;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start2;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end2}`;
        } else {
          return `${start2}${fcPadding}${lines.join(" ")}${fcPadding}${end2}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i2 = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i2 === -1)
            this.items.push(_pair);
          else
            this.items.splice(i2, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i2 = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i2++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i2 = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i2++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format: format2, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format2 && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i2 = n.indexOf(".");
        if (i2 < 0) {
          i2 = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i2 - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i2 = 0; i2 < str.length; ++i2)
            buffer[i2] = str.charCodeAt(i2);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i2 = 0; i2 < buf.length; ++i2)
            s += String.fromCharCode(buf[i2]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i2 = 0, o = 0; i2 < n; ++i2, o += lineWidth) {
            lines[i2] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i2 = 0; i2 < seq.items.length; ++i2) {
          let item = seq.items[i2];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i2] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i2 = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i2++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match2 = str.match(timestamp.test);
        if (!match2)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match2.map(Number);
        const millisec = match2[7] ? Number((match2[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match2[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify2 = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify2.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify2.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify2.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path39, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path39, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path39) {
        if (Collection.isEmptyPath(path39)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path39) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path39, keepScalar) {
        if (Collection.isEmptyPath(path39))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path39, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path39) {
        if (Collection.isEmptyPath(path39))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path39) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path39, value) {
        if (Collection.isEmptyPath(path39)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path39), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path39, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end2 = error.linePos[1];
        if (end2?.line === line && end2.col > col) {
          count = Math.max(1, Math.min(end2.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens2, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start2 = null;
      for (const token of tokens2) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start2 ?? (start2 = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start2 ?? (start2 = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens2[tokens2.length - 1];
      const end2 = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end: end2,
        start: start2 ?? end2
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end2 = fc.end[0];
        if (end2.indent === indent && (end2.source === "]" || end2.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end2, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start: start2, key, sep: sep2, value } = collItem;
        const keyProps = resolveProps.resolveProps(start2, {
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep2) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start2[start2.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start2, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep2 ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep2, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start: start2, value } of bs.items) {
        const props = resolveProps.resolveProps(start2, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start2, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end2, offset, reqSpace, onError) {
      let comment = "";
      if (end2) {
        let hasSpace = false;
        let sep2 = "";
        for (const token of end2) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep2 + cb;
              sep2 = "";
              break;
            }
            case "newline":
              if (comment)
                sep2 += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i2 = 0; i2 < fc.items.length; ++i2) {
        const collItem = fc.items[i2];
        const { start: start2, key, sep: sep2, value } = collItem;
        const props = resolveProps.resolveProps(start2, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep2?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep2 && !value) {
            if (i2 === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i2 < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i2 === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start2) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep2 && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep2, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start2, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep2 ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep2)
                for (const st of sep2) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep2, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end2 = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end2.comment) {
          if (coll.comment)
            coll.comment += "\n" + end2.comment;
          else
            coll.comment = end2.comment;
        }
        coll.range = [fc.offset, cePos, end2.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start2 = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start2, start2, start2] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i2 = lines.length - 1; i2 >= 0; --i2) {
        const content = lines[i2][1];
        if (content === "" || content === "\r")
          chompStart = i2;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end3 = start2 + header.length;
        if (scalar.source)
          end3 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start2, end3, end3] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i2 = 0; i2 < chompStart; ++i2) {
        const [indent, content] = lines[i2];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i2;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i2 = lines.length - 1; i2 >= chompStart; --i2) {
        if (lines[i2][0].length > trimIndent)
          chompStart = i2 + 1;
      }
      let value = "";
      let sep2 = "";
      let prevMoreIndented = false;
      for (let i2 = 0; i2 < contentStart; ++i2)
        value += lines[i2][0].slice(trimIndent) + "\n";
      for (let i2 = contentStart; i2 < chompStart; ++i2) {
        let [indent, content] = lines[i2];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep2 === " ")
            sep2 = "\n";
          else if (!prevMoreIndented && sep2 === "\n")
            sep2 = "\n\n";
          value += sep2 + indent.slice(trimIndent) + content;
          sep2 = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep2 === "\n")
            value += "\n";
          else
            sep2 = "\n";
        } else {
          value += sep2 + content;
          sep2 = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i2 = chompStart; i2 < lines.length; ++i2)
            value += "\n" + lines[i2][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end2 = start2 + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start2, end2, end2] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i2 = 1; i2 < source.length; ++i2) {
        const ch = source[i2];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i2;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i2 = 1; i2 < props.length; ++i2) {
        const token = props[i2];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i2 = 1; i2 < split.length; i2 += 2)
        lines.push([split[i2], split[i2 + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end: end2 } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end2, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match2 = first.exec(source);
      if (!match2)
        return source;
      let res = match2[1];
      let sep2 = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match2 = line.exec(source)) {
        if (match2[1] === "") {
          if (sep2 === "\n")
            res += sep2;
          else
            sep2 = "\n";
        } else {
          res += sep2 + match2[1];
          sep2 = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match2 = last.exec(source);
      return res + sep2 + (match2?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i2 = 1; i2 < source.length - 1; ++i2) {
        const ch = source[i2];
        if (ch === "\r" && source[i2 + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i2);
          res += fold;
          i2 = offset;
        } else if (ch === "\\") {
          let next = source[++i2];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i2 + 1];
            while (next === " " || next === "	")
              next = source[++i2 + 1];
          } else if (next === "\r" && source[i2 + 1] === "\n") {
            next = source[++i2 + 1];
            while (next === " " || next === "	")
              next = source[++i2 + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i2 + 1, length, onError);
            i2 += length;
          } else {
            const raw = source.substr(i2 - 1, 2);
            onError(i2 - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i2;
          let next = source[i2 + 1];
          while (next === " " || next === "	")
            next = source[++i2 + 1];
          if (next !== "\n" && !(next === "\r" && source[i2 + 2] === "\n"))
            res += i2 > wsStart ? source.slice(wsStart, i2 + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i2 = pos - 1; i2 >= 0; --i2) {
          let st = before[i2];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i2];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i2];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end: end2 }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end2;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end: end2 }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end2, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start: start2, value, end: end2 }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start2, {
        indicator: "doc-start",
        next: value ?? end2?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start2, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end2, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i2 = 0; i2 < prelude.length; ++i2) {
        const source = prelude[i2];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i2 + 1]?.[0] !== "#")
              i2 += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i2 = 0; i2 < this.errors.length; ++i2)
            doc.errors.push(this.errors[i2]);
          for (let i2 = 0; i2 < this.warnings.length; ++i2)
            doc.warnings.push(this.warnings[i2]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens2, forceDoc = false, endOffset = -1) {
        for (const token of tokens2)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end2 = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end2.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end2.comment}` : end2.comment;
            }
            this.doc.range[2] = end2.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end2 = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end2))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end: end2 };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end: end2 };
        default:
          return { type: "scalar", offset, indent, source, end: end2 };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end2) {
      if (end2)
        for (const st of end2)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end2 = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end2)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end: end2 });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end2 = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end: end2 });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify2 = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start: start2, key, sep: sep2, value }) {
      let res = "";
      for (const st of start2)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep2)
        for (const st of sep2)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify2;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit2(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit2.BREAK = BREAK;
    visit2.SKIP = SKIP;
    visit2.REMOVE = REMOVE;
    visit2.itemAtPath = (cst, path39) => {
      let item = cst;
      for (const [field, index] of path39) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit2.parentCollection = (cst, path39) => {
      const parent = visit2.itemAtPath(cst, path39.slice(0, -1));
      const field = path39[path39.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path39, item, visitor) {
      let ctrl = visitor(item, path39);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i2 = 0; i2 < token.items.length; ++i2) {
            const ci = _visit(Object.freeze(path39.concat([[field, i2]])), token.items[i2], visitor);
            if (typeof ci === "number")
              i2 = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i2, 1);
              i2 -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path39);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path39) : ctrl;
    }
    exports.visit = visit2;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i2 = this.pos;
        let ch = this.buffer[i2];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i2];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i2 + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end2 = this.lineEndPos;
        if (typeof end2 !== "number" || end2 !== -1 && end2 < this.pos) {
          end2 = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end2;
        }
        if (end2 === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end2 - 1] === "\r")
          end2 -= 1;
        return this.buffer.substring(this.pos, end2);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end2 = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end2 !== -1 && this.buffer[end2 + 1] === "'")
            end2 = this.buffer.indexOf("'", end2 + 2);
        } else {
          while (end2 !== -1) {
            let n = 0;
            while (this.buffer[end2 - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end2 = this.buffer.indexOf('"', end2 + 1);
          }
        }
        const qb = this.buffer.substring(0, end2);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end2 = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end2 === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end2 = this.buffer.length;
        }
        yield* this.pushToIndex(end2 + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i2 = this.pos;
        while (true) {
          const ch = this.buffer[++i2];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i3 = this.pos; ch = this.buffer[i3]; ++i3) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i3;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i3 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i2 = nl + 1;
        ch = this.buffer[i2];
        while (ch === " ")
          ch = this.buffer[++i2];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i2];
          nl = i2 - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i3 = nl - 1;
            let ch2 = this.buffer[i3];
            if (ch2 === "\r")
              ch2 = this.buffer[--i3];
            const lastChar = i3;
            while (ch2 === " ")
              ch2 = this.buffer[--i3];
            if (ch2 === "\n" && i3 >= this.pos && i3 + 1 + indent > lastChar)
              nl = i3;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end2 = this.pos - 1;
        let i2 = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i2]) {
          if (ch === ":") {
            const next = this.buffer[i2 + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end2 = i2;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i2 + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i2 += 1;
                ch = "\n";
                next = this.buffer[i2 + 1];
              } else
                end2 = i2;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i2 + 1);
              if (cs === -1)
                break;
              i2 = Math.max(i2, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end2 = i2;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end2 + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i2, allowEmpty) {
        const s = this.buffer.slice(this.pos, i2);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i2 = this.pos + 2;
          let ch = this.buffer[i2];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i2];
          return yield* this.pushToIndex(ch === ">" ? i2 + 1 : i2, false);
        } else {
          let i2 = this.pos + 1;
          let ch = this.buffer[i2];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i2];
            else if (ch === "%" && hexDigits.has(this.buffer[i2 + 1]) && hexDigits.has(this.buffer[i2 + 2])) {
              ch = this.buffer[i2 += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i2, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i2 = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i2];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i2 - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i2;
        }
        return n;
      }
      *pushUntil(test) {
        let i2 = this.pos;
        let ch = this.buffer[i2];
        while (!test(ch))
          ch = this.buffer[++i2];
        return yield* this.pushToIndex(i2, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start2 = this.lineStarts[low - 1];
          return { line: low, col: offset - start2 + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i2 = 0; i2 < list.length; ++i2)
        if (list[i2].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i2 = 0; i2 < list.length; ++i2) {
        switch (list[i2].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i2;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i2 = prev.length;
      loop: while (--i2 >= 0) {
        switch (prev[i2].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i2]?.type === "space") {
      }
      return prev.splice(i2, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i2 = 0; i2 < source.length; ++i2)
          target.push(source[i2]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start2 = getFirstKeyStartProps(prev);
          let sep2;
          if (scalar.end) {
            sep2 = scalar.end;
            sep2.push(this.sourceToken);
            delete scalar.end;
          } else
            sep2 = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start: start2, key: scalar, sep: sep2 }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end2 = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end2) ? end2[end2.length - 1] : void 0;
              if (last?.type === "comment")
                end2?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end2 = prev?.value?.end;
                if (Array.isArray(end2)) {
                  arrayPushArray(end2, it.start);
                  end2.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start2 = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i2 = 0; i2 < it.sep.length; ++i2) {
              const st = it.sep[i2];
              switch (st.type) {
                case "newline":
                  nl.push(i2);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start2 = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start2.push(this.sourceToken);
                map.items.push({ start: start2 });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start2.push(this.sourceToken);
                map.items.push({ start: start2, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start3 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start3, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start3 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep2 = it.sep;
                  sep2.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start3, key, sep: sep2 }]
                  });
                } else if (start2.length > 0) {
                  it.sep = it.sep.concat(start2, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start: start2, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start: start2, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start: start2 });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end2 = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end2) ? end2[end2.length - 1] : void 0;
              if (last?.type === "comment")
                end2?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end2 = prev?.value?.end;
                if (Array.isArray(end2)) {
                  arrayPushArray(end2, it.start);
                  end2.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start2 = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep2 = fc.end.splice(1, fc.end.length);
            sep2.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start: start2, key: fc, sep: sep2 }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start2 = getFirstKeyStartProps(prev);
            start2.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: start2, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start2 = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: start2, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start2, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start2.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse6(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify2(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse6;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify2;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit2 = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit2.visit;
    exports.visitAsync = visit2.visitAsync;
  }
});

// node_modules/balanced-match/index.js
var require_balanced_match = __commonJS({
  "node_modules/balanced-match/index.js"(exports, module) {
    "use strict";
    module.exports = balanced;
    function balanced(a, b, str) {
      if (a instanceof RegExp) a = maybeMatch(a, str);
      if (b instanceof RegExp) b = maybeMatch(b, str);
      var r = range(a, b, str);
      return r && {
        start: r[0],
        end: r[1],
        pre: str.slice(0, r[0]),
        body: str.slice(r[0] + a.length, r[1]),
        post: str.slice(r[1] + b.length)
      };
    }
    function maybeMatch(reg, str) {
      var m = str.match(reg);
      return m ? m[0] : null;
    }
    balanced.range = range;
    function range(a, b, str) {
      var begs, beg, left, right, result;
      var ai = str.indexOf(a);
      var bi = str.indexOf(b, ai + 1);
      var i2 = ai;
      if (ai >= 0 && bi > 0) {
        if (a === b) {
          return [ai, bi];
        }
        begs = [];
        left = str.length;
        while (i2 >= 0 && !result) {
          if (i2 == ai) {
            begs.push(i2);
            ai = str.indexOf(a, i2 + 1);
          } else if (begs.length == 1) {
            result = [begs.pop(), bi];
          } else {
            beg = begs.pop();
            if (beg < left) {
              left = beg;
              right = bi;
            }
            bi = str.indexOf(b, i2 + 1);
          }
          i2 = ai < bi && ai >= 0 ? ai : bi;
        }
        if (begs.length) {
          result = [left, right];
        }
      }
      return result;
    }
  }
});

// node_modules/brace-expansion/index.js
var require_brace_expansion = __commonJS({
  "node_modules/brace-expansion/index.js"(exports, module) {
    var balanced = require_balanced_match();
    module.exports = expandTop;
    var escSlash = "\0SLASH" + Math.random() + "\0";
    var escOpen = "\0OPEN" + Math.random() + "\0";
    var escClose = "\0CLOSE" + Math.random() + "\0";
    var escComma = "\0COMMA" + Math.random() + "\0";
    var escPeriod = "\0PERIOD" + Math.random() + "\0";
    function numeric(str) {
      return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
    }
    function escapeBraces(str) {
      return str.split("\\\\").join(escSlash).split("\\{").join(escOpen).split("\\}").join(escClose).split("\\,").join(escComma).split("\\.").join(escPeriod);
    }
    function unescapeBraces(str) {
      return str.split(escSlash).join("\\").split(escOpen).join("{").split(escClose).join("}").split(escComma).join(",").split(escPeriod).join(".");
    }
    function parseCommaParts(str) {
      if (!str)
        return [""];
      var parts = [];
      var m = balanced("{", "}", str);
      if (!m)
        return str.split(",");
      var pre = m.pre;
      var body = m.body;
      var post = m.post;
      var p = pre.split(",");
      p[p.length - 1] += "{" + body + "}";
      var postParts = parseCommaParts(post);
      if (post.length) {
        p[p.length - 1] += postParts.shift();
        p.push.apply(p, postParts);
      }
      parts.push.apply(parts, p);
      return parts;
    }
    function expandTop(str, options) {
      if (!str)
        return [];
      options = options || {};
      var max2 = options.max == null ? Infinity : options.max;
      if (str.substr(0, 2) === "{}") {
        str = "\\{\\}" + str.substr(2);
      }
      return expand2(escapeBraces(str), max2, true).map(unescapeBraces);
    }
    function embrace(str) {
      return "{" + str + "}";
    }
    function isPadded(el) {
      return /^-?0\d/.test(el);
    }
    function lte(i2, y) {
      return i2 <= y;
    }
    function gte(i2, y) {
      return i2 >= y;
    }
    function expand2(str, max2, isTop) {
      var expansions = [];
      var m = balanced("{", "}", str);
      if (!m) return [str];
      var pre = m.pre;
      var post = m.post.length ? expand2(m.post, max2, false) : [""];
      if (/\$$/.test(m.pre)) {
        for (var k = 0; k < post.length && k < max2; k++) {
          var expansion = pre + "{" + m.body + "}" + post[k];
          expansions.push(expansion);
        }
      } else {
        var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
        var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
        var isSequence = isNumericSequence || isAlphaSequence;
        var isOptions = m.body.indexOf(",") >= 0;
        if (!isSequence && !isOptions) {
          if (m.post.match(/,(?!,).*\}/)) {
            str = m.pre + "{" + m.body + escClose + m.post;
            return expand2(str, max2, true);
          }
          return [str];
        }
        var n;
        if (isSequence) {
          n = m.body.split(/\.\./);
        } else {
          n = parseCommaParts(m.body);
          if (n.length === 1) {
            n = expand2(n[0], max2, false).map(embrace);
            if (n.length === 1) {
              return post.map(function(p) {
                return m.pre + n[0] + p;
              });
            }
          }
        }
        var N;
        if (isSequence) {
          var x2 = numeric(n[0]);
          var y = numeric(n[1]);
          var width = Math.max(n[0].length, n[1].length);
          var incr = n.length == 3 ? Math.max(Math.abs(numeric(n[2])), 1) : 1;
          var test = lte;
          var reverse = y < x2;
          if (reverse) {
            incr *= -1;
            test = gte;
          }
          var pad = n.some(isPadded);
          N = [];
          for (var i2 = x2; test(i2, y) && N.length < max2; i2 += incr) {
            var c;
            if (isAlphaSequence) {
              c = String.fromCharCode(i2);
              if (c === "\\")
                c = "";
            } else {
              c = String(i2);
              if (pad) {
                var need = width - c.length;
                if (need > 0) {
                  var z = new Array(need + 1).join("0");
                  if (i2 < 0)
                    c = "-" + z + c.slice(1);
                  else
                    c = z + c;
                }
              }
            }
            N.push(c);
          }
        } else {
          N = [];
          for (var j = 0; j < n.length; j++) {
            N.push.apply(N, expand2(n[j], max2, false));
          }
        }
        for (var j = 0; j < N.length; j++) {
          for (var k = 0; k < post.length && expansions.length < max2; k++) {
            var expansion = pre + N[j] + post[k];
            if (!isTop || isSequence || expansion)
              expansions.push(expansion);
          }
        }
      }
      return expansions;
    }
  }
});

// src/commands/doctor.ts
import path4 from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// src/index.ts
var VERSION = "1.0.0";
var MINIMUM_NODE_MAJOR = 18;

// src/utils/fs.ts
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function isWritable(directory) {
  try {
    await access(directory, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return void 0;
  }
}
async function writeFileExclusive(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(filePath, content, { encoding: "utf8", flag: "wx" });
    return "created";
  } catch (error) {
    if (error.code === "EEXIST") return "skipped";
    throw error;
  }
}
async function listFiles(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(target) : [target];
    })
  );
  return files.flat().sort();
}

// src/core/project-scanner.ts
import path2 from "node:path";
var unique = (items) => [...new Set(items)];
async function scanProject(root) {
  const packagePath = path2.join(root, "package.json");
  const packageJson = await readJson(packagePath) ?? {};
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  const language = [];
  const framework = [];
  if (await exists(packagePath)) language.push("JavaScript");
  if (await exists(path2.join(root, "tsconfig.json"))) language.push("TypeScript");
  if (await exists(path2.join(root, "pyproject.toml")) || await exists(path2.join(root, "requirements.txt"))) language.push("Python");
  if (await exists(path2.join(root, "go.mod"))) language.push("Go");
  if (await exists(path2.join(root, "pom.xml")) || await exists(path2.join(root, "build.gradle")) || await exists(path2.join(root, "build.gradle.kts"))) language.push("Java");
  const frameworkMap = {
    next: "Next.js",
    react: "React",
    vue: "Vue",
    angular: "Angular",
    express: "Express",
    fastify: "Fastify",
    nestjs: "NestJS",
    "@nestjs/core": "NestJS",
    vitest: "Vitest",
    jest: "Jest"
  };
  for (const [dependency, name] of Object.entries(frameworkMap)) {
    if (dependency in dependencies) framework.push(name);
  }
  let packageManager;
  if (await exists(path2.join(root, "pnpm-lock.yaml"))) packageManager = "pnpm";
  else if (await exists(path2.join(root, "yarn.lock"))) packageManager = "yarn";
  else if (await exists(path2.join(root, "package-lock.json"))) packageManager = "npm";
  else if (packageJson.packageManager) packageManager = packageJson.packageManager.split("@")[0];
  const scripts = packageJson.scripts ?? {};
  const commandPrefix = packageManager ?? "npm";
  const run = (name) => commandPrefix === "npm" ? `npm run ${name}` : `${commandPrefix} ${name}`;
  const firstScript = (...names) => {
    const name = names.find((candidate) => scripts[candidate]);
    return name ? run(name) : void 0;
  };
  const hasOpenSpec = await exists(path2.join(root, ".openspec"));
  const hasAdr = await exists(path2.join(root, "docs", "adr"));
  const riskPaths = [
    "src/auth/**",
    "src/billing/**",
    "database/migrations/**",
    ".github/workflows/**",
    "infra/**",
    "terraform/**"
  ];
  return {
    root,
    language: unique(language),
    framework: unique(framework),
    packageManager,
    testCommands: {
      unit: firstScript("test", "test:unit"),
      typecheck: firstScript("typecheck", "type-check"),
      lint: firstScript("lint"),
      specValidate: hasOpenSpec ? "openspec validate" : void 0
    },
    process: {
      hasOpenSpec,
      openSpecRoot: hasOpenSpec ? ".openspec" : void 0,
      hasAdr,
      adrRoot: hasAdr ? "docs/adr" : void 0,
      hasAgents: await exists(path2.join(root, "AGENTS.md")),
      hasSecurity: await exists(path2.join(root, "SECURITY.md")),
      hasCiWorkflows: await exists(path2.join(root, ".github", "workflows"))
    },
    riskPaths
  };
}

// src/core/asset-root.ts
import path3 from "node:path";
var DEFAULT_ASSET_ROOT = ".repo-agent";
var PRIVATE_ASSET_ROOT = ".repo-agent-private";
async function resolveAssetRoot(root) {
  return {
    name: DEFAULT_ASSET_ROOT,
    path: path3.join(root, DEFAULT_ASSET_ROOT),
    warnings: []
  };
}
function relativeAssetPath(_assetRoot, ...segments) {
  return path3.posix.join(DEFAULT_ASSET_ROOT, ...segments);
}
async function resolveLocalConfigPath(root) {
  return path3.join(root, ".repo-agent.local.yaml");
}
function privateAssetPath(root, ...segments) {
  return path3.join(root, PRIVATE_ASSET_ROOT, ...segments);
}

// src/commands/doctor.ts
var execFileAsync = promisify(execFile);
async function hasWorkingGit(root) {
  if (!await exists(path4.join(root, ".git"))) return false;
  try {
    await execFileAsync("git", ["status", "--short"], { cwd: root });
    return true;
  } catch {
    return false;
  }
}
async function doctor(root) {
  const profile = await scanProject(root);
  const assetRoot = await resolveAssetRoot(root);
  const major = Number.parseInt(process.versions.node.split(".")[0], 10);
  const nodeSupported = major >= MINIMUM_NODE_MAJOR;
  const initialized = await exists(path4.join(assetRoot.path, "config.yaml"));
  const writeAccess = await isWritable(root);
  const git = await hasWorkingGit(root);
  const mcpCompatible = await exists(path4.join(root, ".codex", "config.toml")) || await exists(path4.join(root, ".mcp.json")) || await exists(path4.join(root, "opencode.json"));
  const warnings = [];
  if (!initialized) warnings.push("\u9879\u76EE\u5C1A\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u8FD0\u884C `repo-agent init`\u3002");
  if (!git) warnings.push("Git \u80FD\u529B\u4E0D\u53EF\u7528\uFF1B\u4F9D\u8D56 Git \u7684\u529F\u80FD\u5C06\u91C7\u7528\u5B89\u5168\u964D\u7EA7\u6A21\u5F0F\u3002");
  if (!profile.testCommands.unit) warnings.push("\u672A\u68C0\u6D4B\u5230\u6D4B\u8BD5\u547D\u4EE4\u3002");
  if (!profile.packageManager) warnings.push("\u672A\u68C0\u6D4B\u5230\u5305\u7BA1\u7406\u5668\u3002");
  const checks = [
    {
      id: "node",
      ok: nodeSupported,
      message: nodeSupported ? `Node.js ${process.versions.node} \u7248\u672C\u53D7\u652F\u6301\u3002` : `\u9700\u8981 Node.js >= ${MINIMUM_NODE_MAJOR}\u3002`
    },
    {
      id: "write_access",
      ok: writeAccess,
      message: writeAccess ? "\u9879\u76EE\u6839\u76EE\u5F55\u53EF\u5199\u3002" : "\u9879\u76EE\u6839\u76EE\u5F55\u4E0D\u53EF\u5199\u3002"
    },
    {
      id: "project_structure",
      ok: initialized,
      message: initialized ? `\u5DF2\u627E\u5230 ${relativeAssetPath(assetRoot, "config.yaml")}\u3002` : `\u7F3A\u5C11 ${relativeAssetPath(assetRoot, "config.yaml")}\u3002`
    }
  ];
  return {
    ok: nodeSupported && writeAccess && initialized,
    command: "doctor",
    version: VERSION,
    node: {
      current: process.versions.node,
      minimum: `${MINIMUM_NODE_MAJOR}.0.0`,
      supported: nodeSupported
    },
    project: {
      root,
      initialized,
      hasAgents: profile.process.hasAgents,
      hasGit: git,
      writeAccess
    },
    capabilities: {
      node: nodeSupported,
      git,
      writeAccess,
      testCommands: Boolean(profile.testCommands.unit),
      packageManager: Boolean(profile.packageManager),
      openspec: profile.process.hasOpenSpec,
      adr: profile.process.hasAdr,
      mcpCompatible
    },
    checks,
    warnings: [...assetRoot.warnings, ...warnings]
  };
}

// src/commands/init.ts
import path9 from "node:path";
import { mkdir as mkdir3 } from "node:fs/promises";

// src/core/template-renderer.ts
function renderTemplate(template, values) {
  return template.replace(
    /\{\{([A-Z0-9_]+)\}\}/g,
    (match2, key) => Object.hasOwn(values, key) ? values[key] : match2
  );
}

// src/templates.ts
var templates = {
  config: `version: 1
mode: {{MODE}}

network:
  mode: offline
  allow:
    - localhost
    - "*.internal"
  deny:
    - "*"

audit:
  enabled: true
  write_to: .repo-agent/generated/audits

context:
  include_candidate_suggestions: true
  max_candidate_suggestions: 1
  min_relevance: 0.15
  max_items:
    memories: 8
    skills: 4
    fix_patterns: 4
    candidate_suggestions: 1
  budget:
    max_chars: 24000
    max_tokens_estimate: 6000

recurring_error_policy:
  enabled: true
  thresholds:
    inbox: 2
    propose_fix_pattern: 3
    propose_skill: 5
  high_risk_multiplier: 0.5
  include_in_context: true
  max_context_recommendations: 3

automatic_growth_policy:
  enabled: true
  validated_preflights: 3
  validated_days: 2
  background_observation_threshold: 20
  background_max_age_hours: 24

asset_lifecycle_policy:
  enabled: true
  private_automatic_cleanup: true
  team_proposal_only: true
  thresholds:
    stale: 0.45
    archive: 0.30
  durations_days:
    stale: 90
    archive: 180
    delete: 180
    private_retention: 180

closure_policy:
  abandon_after_hours: 24
  max_events_per_preflight: 10000
  max_event_bytes: 262144

evidence_policy:
  freshness_half_life_days: 180
`,
  teamCommitPolicy: `version: 1
default_mode: ask

allow_direct_commit_for:
  - docs
  - comments
  - formatting
  - low_risk_tests

require_review_request_for:
  - src/auth/**
  - src/billing/**
  - database/migrations/**
  - .github/workflows/**
  - infra/**
  - terraform/**
  - .repo-agent/policies/**
  - .repo-agent/skills/approved/**
  - .repo-agent/memories/**
  - .repo-agent/fix_patterns/approved/**
  - .openspec/**
  - docs/adr/**

always_ask_before_commit: true
allow_direct_commit_memory_candidates: true
require_review_for_approved_memory: true
require_review_for_approved_skill: true
require_review_for_approved_fix_pattern: true
`,
  personalCommitPolicy: `version: 1
default_mode: keep_local

allow_direct_commit_for:
  - docs
  - comments
  - formatting
  - low_risk_tests
  - low_risk_code

require_review_request_for:
  - src/auth/**
  - src/billing/**
  - database/migrations/**
  - .github/workflows/**
  - infra/**
  - terraform/**
  - .repo-agent/policies/**
  - .repo-agent/skills/approved/**
  - .repo-agent/memories/**
  - .repo-agent/fix_patterns/approved/**
  - .openspec/**
  - docs/adr/**

always_ask_before_commit: true
allow_direct_commit_memory_candidates: true
require_review_for_approved_memory: true
require_review_for_approved_skill: true
require_review_for_approved_fix_pattern: true
`,
  protectedFiles: `version: 1
protected_files:
  - .env*
  - "*.pem"
  - "*.key"
  - id_rsa
  - id_ed25519
  - secrets.*
  - .github/workflows/**
  - infra/**
  - terraform/**
  - k8s/production/**
  - database/migrations/**
`,
  commandPolicy: `version: 1
dangerous_commands:
  - "rm -rf"
  - sudo
  - "curl * | sh"
  - "wget * | sh"
  - "terraform apply"
  - "kubectl apply"
  - "docker --privileged"
  - "gh secret"
default_action: require_confirmation
`,
  permissions: `version: 1
defaults:
  network: deny
  shell: allow_safe
  git_write: require_confirmation
`,
  memory: (title, description) => `# ${title}

${description}

\u672C\u6587\u4EF6\u53EA\u8BB0\u5F55\u7ECF\u8FC7\u5BA1\u6838\u7684\u9879\u76EE\u77E5\u8BC6\uFF0C\u4E0D\u5F97\u5199\u5165\u654F\u611F\u4FE1\u606F\u3002
`,
  skill: `id: skill.bugfix.red-green-refactor
version: 1
status: approved
title: \u7EA2-\u7EFF-\u91CD\u6784\u7F3A\u9677\u4FEE\u590D
steps:
  - \u5148\u7528\u56DE\u5F52\u6D4B\u8BD5\u590D\u73B0\u5931\u8D25\u3002
  - \u5B9E\u65BD\u6700\u5C0F\u4E14\u5B89\u5168\u7684\u4FEE\u6539\u3002
  - \u8FD0\u884C\u9488\u5BF9\u6027\u6D4B\u8BD5\u548C\u76F8\u5173\u7684\u66F4\u5E7F\u6CDB\u68C0\u67E5\u3002
`,
  fixPattern: `id: fix.auth.oauth-invalid-state
version: 1
status: approved
title: OAuth state \u65E0\u6548
patterns:
  - invalid oauth state
  - oauth callback state mismatch
guidance:
  - \u68C0\u67E5\u7F3A\u5931\u3001\u65E0\u6548\u3001\u8FC7\u671F\u548C\u91CD\u653E state \u7684\u5904\u7406\u3002
  - \u4FEE\u6539\u884C\u4E3A\u524D\u5148\u8865\u5145\u8D1F\u5411\u56DE\u5F52\u6D4B\u8BD5\u3002
recurrence:
  occurrences: 0
`,
  usageGuide: `# repo-agent \u9879\u76EE\u4F7F\u7528\u8BF4\u660E

\u672C\u76EE\u5F55\u7531 \`repo-agent init\` \u751F\u6210\uFF0C\u7528\u4E8E\u5728\u5F53\u524D\u9879\u76EE\u4E2D\u627F\u8F7D\u6CBB\u7406\u4E8B\u5B9E\u6E90\u548C\u8D44\u4EA7\u3002\u4EE5\u4E0B\u5185\u5BB9\u8BF4\u660E\u5B83\u662F\u4EC0\u4E48\u3001\u5305\u542B\u54EA\u4E9B\u8D44\u4EA7\u3001\u5E38\u7528\u547D\u4EE4\uFF0C\u4EE5\u53CA\u6BCF\u6B21\u4F1A\u8BDD\u80CC\u540E\u53D1\u751F\u4E86\u4EC0\u4E48\u3002

## 1. repo-agent \u662F\u4EC0\u4E48

repo-agent \u662F\u4E00\u4E2A\u672C\u5730\u6CBB\u7406\u4E0E\u77E5\u8BC6\u5C42\uFF0C\u901A\u8FC7 Hook\uFF08\u94A9\u5B50\uFF09\u3001Plugin\uFF08\u63D2\u4EF6\uFF09 \u548C MCP\uFF08\u6A21\u578B\u4E0A\u4E0B\u6587\u534F\u8BAE\uFF09 \u4E0E Codex\u3001Claude Code\u3001OpenCode \u534F\u4F5C\uFF1A

- \u6BCF\u4E00\u8F6E\u4EFB\u52A1\u5F00\u59CB\u65F6\uFF0C\u6CE8\u5165\u53D7\u4FE1\u4EFB\u7684\u7B56\u7565\u3001\u8BB0\u5FC6\u3001\u6280\u80FD\u3001\u4FEE\u590D\u6A21\u5F0F\u548C\u5019\u9009\u5EFA\u8BAE\uFF1B
- \u5224\u5B9A\u98CE\u9669\u7B49\u7EA7\u5E76\u58F0\u660E\u5FC5\u987B\u6267\u884C\u7684\u52A8\u4F5C\uFF08\u5982\u8FD0\u884C\u6D4B\u8BD5\u3001\u8981\u6C42\u786E\u8BA4\uFF09\uFF1B
- \u7ED3\u675F\u65F6\u95ED\u73AF\u8BB0\u5F55\u5BA1\u8BA1\u3001\u89C2\u5BDF\u3001\u590D\u53D1\u9519\u8BEF\u5206\u6790\u3001\u8D44\u4EA7\u751F\u547D\u5468\u671F\u8BC4\u4F30\u548C\u5EA6\u91CF\u3002

\u5B83\u4E0D\u4F1A\u66FF\u4EE3\u4EFB\u4F55 AI \u5BA2\u6237\u7AEF\uFF0C\u53EA\u4F5C\u4E3A\u6CBB\u7406\u5C42\u8FD0\u884C\uFF1B\u9ED8\u8BA4\u79BB\u7EBF\uFF0C\u7F51\u7EDC\u7B56\u7565\u7531 \`config.yaml\` \u63A7\u5236\u3002

## 2. \`.repo-agent/\` \u76EE\u5F55\u8BF4\u660E

- \`config.yaml\`\uFF1A\u9879\u76EE\u7EA7\u914D\u7F6E\u4E8B\u5B9E\u6E90\uFF08\u6A21\u5F0F\u3001\u98CE\u9669\u7B56\u7565\u3001\u4E0A\u4E0B\u6587\u9884\u7B97\u7B49\uFF09\u3002
- \`commit_policy.yaml\`\uFF1A\u63D0\u4EA4\u51B3\u7B56\u7B56\u7565\u3002
- \`hooks/routes.yaml\`\uFF1AHook \u8DEF\u7531\uFF08\u4F1A\u8BDD\u5F00\u59CB / \u7528\u6237\u63D0\u793A / \u5DE5\u5177\u8C03\u7528 / \u505C\u6B62\uFF09\u3002
- \`policies/\`\uFF1A\u547D\u4EE4\u3001\u6743\u9650\u3001\u53D7\u4FDD\u62A4\u6587\u4EF6\u7B49\u5B89\u5168\u7B56\u7565\u3002
- \`memories/\`\u3001\`skills/\`\u3001\`fix_patterns/\`\uFF1A\u5BA1\u6838\u901A\u8FC7\u7684\u56E2\u961F\u77E5\u8BC6\u8D44\u4EA7\u3002
- \`adapters/\`\u3001\`tools/\`\uFF1A\u9002\u914D\u5668\u4E0E\u5DE5\u5177/\u6743\u9650\u6CE8\u518C\u8868\u3002
- \`review_lenses/\`\u3001\`workflows/\`\uFF1A\u5BA1\u67E5\u89C6\u89D2\u4E0E\u6D41\u7A0B\u6A21\u677F\u3002
- \`catalog/\`\uFF1A\u8D44\u4EA7\u7D22\u5F15\uFF0C\u7528\u4E8E\u5FEB\u901F\u68C0\u7D22\u3002
- \`generated/\`\uFF1A\u5BA1\u8BA1\u3001\u590D\u53D1\u9519\u8BEF\u3001\u8865\u4E01\u3001\u521D\u59CB\u5316\u62A5\u544A\u7B49\u6D3E\u751F\u4EA7\u7269\uFF08\u9ED8\u8BA4\u4E0D\u5165\u5E93\uFF09\u3002

\u540C\u7EA7\u8FD8\u4F1A\u770B\u5230\uFF1A
- \`.repo-agent-private/\`\uFF1A\u79C1\u6709\u5019\u9009\u3001\u89C2\u5BDF\u3001\u5B66\u4E60\u4EA7\u7269\uFF08\u672C\u5730\u4FDD\u7559\uFF09\u3002
- \`.repo-agent-runtime/\`\uFF1Apreflight/closure/\u4E8B\u4EF6\u6D41/\u5EA6\u91CF\u5FEB\u7167\uFF08\u672C\u5730\u72B6\u6001\uFF09\u3002

## 3. \u5E38\u7528\u547D\u4EE4

\u4EA4\u4E92\u5165\u53E3\uFF1A

- Codex\uFF1A\u4F7F\u7528 \`$repo-agent\`\uFF0C\u6216\u5728 \`/skills\` \u4E2D\u9009\u62E9 repo-agent\u3002
- Claude Code\uFF1A\u4F7F\u7528 \`/repo-agent\`\u3002
- OpenCode\uFF1A\u4F7F\u7528 \`/repo-agent\`\u3002

\u4EA4\u4E92\u83DC\u5355\u53EF\u5B8C\u6210\u66F4\u65B0\u3001\u8BCA\u65AD\u3001\u63A5\u5165\u3001\u7ECF\u9A8C\u5BA1\u6838\u3001\u91CD\u590D\u9519\u8BEF\u5206\u6790\u3001\u95ED\u73AF\u6062\u590D\u548C\u751F\u547D\u5468\u671F\u7BA1\u7406\u3002\u67E5\u8BE2\u64CD\u4F5C\u53EF\u76F4\u63A5\u6267\u884C\uFF1B\u5199\u64CD\u4F5C\u4F1A\u5148\u9884\u6F14\u5E76\u8BF7\u6C42\u786E\u8BA4\u3002Skill \u53EA\u8C03\u7528\u4E0B\u5217 CLI\uFF0C\u4E0D\u63D0\u4F9B\u6784\u5EFA\u3001\u6253\u5305\u6216\u53D1\u5E03\u529F\u80FD\u3002

\u5B89\u88C5\u4E0E\u540C\u6B65\uFF1A

\`\`\`bash
node repo-agent/repo-agent.bundle.js init --mode team --tool all --entry auto
node repo-agent/repo-agent.bundle.js update
node repo-agent/repo-agent.bundle.js handshake --tool auto --json
\`\`\`

\u8BCA\u65AD\u4E0E\u5065\u5EB7\uFF1A

\`\`\`bash
node repo-agent/repo-agent.bundle.js doctor --json
node repo-agent/repo-agent.bundle.js validate --strict --json
node repo-agent/repo-agent.bundle.js status --json
node repo-agent/repo-agent.bundle.js health check --deep --json
\`\`\`

\u4EFB\u52A1\u95ED\u73AF\u4E0E\u5BA1\u8BA1\uFF08Stop \u4E4B\u540E\u53EF\u663E\u5F0F\u8865\u5F55\uFF09\uFF1A

\`\`\`bash
node repo-agent/repo-agent.bundle.js commit-options --session-id <\u4F1A\u8BDD> --json
node repo-agent/repo-agent.bundle.js record-trace --session-id <\u4F1A\u8BDD> --outcome-status success --json
node repo-agent/repo-agent.bundle.js closure status --session-id <\u4F1A\u8BDD>
\`\`\`

\u8D44\u4EA7\u6CBB\u7406\uFF1A

\`\`\`bash
node repo-agent/repo-agent.bundle.js memory list-candidates --visibility private
node repo-agent/repo-agent.bundle.js memory approve <candidate-id>
node repo-agent/repo-agent.bundle.js lifecycle propose --dry-run
node repo-agent/repo-agent.bundle.js maintain --dry-run --json
\`\`\`

\u5347\u7EA7\uFF08\u6CBF\u7528 \`update\`\uFF0C\u65E0\u5347\u7EA7\u5305\u65F6\u7B49\u4EF7\u4E8E\u540C\u6B65\uFF09\uFF1A

\`\`\`bash
node repo-agent/repo-agent.bundle.js update --source ./repo-agent-node-offline.zip --dry-run
node repo-agent/repo-agent.bundle.js update --source ./repo-agent-node-offline.zip --yes
node repo-agent/repo-agent.bundle.js update --rollback [<run-id>]
\`\`\`

## 4. \u4E00\u8F6E\u4F1A\u8BDD\u80CC\u540E\u53D1\u751F\u4E86\u4EC0\u4E48

1. \`session-start\`\uFF1ACodex/Claude Code Hook \u6216 OpenCode Plugin \u901A\u77E5 repo-agent\uFF0C\u63E1\u624B\u786E\u8BA4\u63A5\u5165\u72B6\u6001\u3002
2. \`user-prompt-submit\`\uFF1A\u751F\u547D\u5468\u671F\u9002\u914D\u5668\u8DEF\u7531\u5230 \`task_preflight\`\uFF0C\u6784\u5EFA ContextPack\uFF08\u53D7\u4FE1\u4EFB\u6307\u4EE4\u3001\u76F8\u5173\u8BB0\u5FC6/\u6280\u80FD/\u4FEE\u590D\u6A21\u5F0F\u3001\u5019\u9009\u5EFA\u8BAE\u3001\u590D\u53D1\u9519\u8BEF\u5EFA\u8BAE\uFF09\u3001\u5224\u5B9A\u98CE\u9669\u7B49\u7EA7\u3001\u58F0\u660E\u5FC5\u987B\u52A8\u4F5C\u548C\u63A8\u8350\u6D4B\u8BD5\u3002
3. \u5BA2\u6237\u7AEF\u6267\u884C\u4EFB\u52A1\uFF1B\u82E5\u89E6\u53CA\u6CE8\u518C\u5DE5\u5177\uFF0C\u4F1A\u7ECF\u8FC7 \`pre-tool-use\` \u8FDB\u5165\u7B56\u7565\u5F15\u64CE\u3002
4. \`stop\`\uFF1AHook \u8DEF\u7531\u5230 \`task_closure\`\uFF0C\u4F9D\u6B21\u5B8C\u6210 \`commit_advice\` \u2192 \`audit_recorded\` \u2192 \`observation_captured\` \u2192 \`recurring_analyzed\` \u2192 \`lifecycle_evaluated\` \u2192 \`metrics_updated\`\u3002
5. \u5BA1\u8BA1\u5199\u5165 \`.repo-agent/generated/audits/\`\uFF0C\u4E8B\u4EF6\u6D41\u5199\u5165 \`.repo-agent-runtime/events/\`\uFF0C\u89C2\u5BDF\u5199\u5165 \`.repo-agent-private/observations/\`\uFF0C\u5EA6\u91CF\u5237\u65B0\u5230 \`.repo-agent-runtime/metrics/latest.json\`\u3002

## 5. MCP \u5DE5\u5177\uFF08\u4F9B\u652F\u6301 MCP \u7684\u5BA2\u6237\u7AEF\u8C03\u7528\uFF09

\`get_context_pack\`\u3001\`get_latest_preflight\`\u3001\`get_closure_status\`\u3001\`recover_closure\`\u3001\`get_asset_evidence\`\u3001\`search_assets\`\u3001\`promote_candidate\`\u3001\`get_health_metrics\`\u3001\`check_policy\`\u3001\`recommend_tests\`\u3001\`get_commit_options\`\u3001\`propose_memory\` / \`propose_skill\` / \`propose_fix_pattern\`\u3001\`classify_learning\`\u3001\`record_trace\`\u3001\`list_skills\` / \`list_fix_patterns\`\u3001\`list_recurring_errors\`\u3001\`analyze_recurring_errors\`\u3001\`recommend_for_recurring_errors\`\u3001\`propose_fix_pattern_from_recurring_error\`\u3001\`detect_duplicates\`\u3001\`redact_secrets\`\u3001\`resolve_conflicts\`\u3001\`generate_patch_summary\`\u3002

## 6. \u540E\u7EED\u6B65\u9AA4

1. \u5BA1\u6838 \`.repo-agent/config.yaml\` \u548C \`.repo-agent/commit_policy.yaml\`\u3002
2. \u56E2\u961F\u534F\u4F5C\u6A21\u5F0F\u4E0B\uFF0C\u5C06 \`.repo-agent/\` \u4E2D\u56E2\u961F\u5171\u4EAB\u90E8\u5206\u63D0\u4EA4\u5165\u5E93\uFF1B\`generated/\`\u3001\`catalog/\` \u5DF2\u9ED8\u8BA4\u5FFD\u7565\u3002
3. \u5BA2\u6237\u7AEF\u63A5\u5165\u9996\u6B21\u914D\u7F6E\u540E\u9700\u8981\u65B0\u5EFA\u4F1A\u8BDD\uFF08\u6216\u91CD\u65B0\u6253\u5F00\u5DE5\u5177\uFF09\u4EE5\u52A0\u8F7D\u65B0\u7684 Hook/Plugin/MCP\u3002
4. Skill \u6216\u547D\u4EE4\u5165\u53E3\u7531 repo-agent \u7BA1\u7406\uFF1B\`update\` \u53EF\u4FEE\u590D\uFF0C\`deactivate\` \u53EF\u79FB\u9664\u3002
5. \u66F4\u591A\u7EC6\u8282\u8BF7\u67E5\u770B \`.repo-agent/generated/init_report.md\`\uFF08\u672C\u6B21\u521D\u59CB\u5316\u6458\u8981\uFF09\u3002
`
};

// src/errors.ts
var CliError = class extends Error {
  constructor(code, message, path39) {
    super(message);
    this.code = code;
    this.path = path39;
  }
  code;
  path;
};

// src/core/gitignore-manager.ts
import path5 from "node:path";
import { readFile as readFile2, writeFile as writeFile2 } from "node:fs/promises";
var managedGitignoreStart = "# >>> repo-agent managed";
var managedGitignoreEnd = "# <<< repo-agent managed";
var gitignoreSections = [
  {
    title: "repo-agent\uFF1A\u56E2\u961F\u8FD0\u884C\u7A0B\u5E8F",
    entries: [
      "!/repo-agent/",
      "!/repo-agent/**"
    ]
  },
  {
    title: "repo-agent\uFF1A\u4E2A\u4EBA\u914D\u7F6E",
    entries: [
      "/.repo-agent.local.yaml",
      "/.repo-agent.local.yml",
      "/.repo-agent-private/"
    ]
  },
  {
    title: "repo-agent\uFF1A\u6D3E\u751F\u6587\u4EF6\u4E0E\u8FD0\u884C\u72B6\u6001",
    entries: [
      "/.repo-agent/generated/",
      "/.repo-agent/catalog/",
      "/.repo-agent/cache/",
      "/.repo-agent/index/",
      "/.repo-agent/traces/",
      "/.repo-agent/logs/",
      "/.repo-agent/runs/",
      "/.repo-agent/artifacts/",
      "/.repo-agent/sessions/",
      "/.repo-agent/worktrees/",
      "/.repo-agent/tmp/",
      "/.repo-agent/embeddings/",
      "/.repo-agent/learning_inbox/",
      "/.repo-agent-runtime/"
    ]
  },
  {
    title: "repo-agent\uFF1A\u672C\u5730\u6570\u636E\u3001\u7D22\u5F15\u3001\u65E5\u5FD7\u4E0E\u4E34\u65F6\u6587\u4EF6",
    entries: [
      ".repo-agent/**/*.db",
      ".repo-agent/**/*.sqlite",
      ".repo-agent/**/*.sqlite3",
      ".repo-agent/**/*.jsonl",
      ".repo-agent/**/*.log",
      ".repo-agent/**/*.faiss",
      ".repo-agent/**/*.ann",
      ".repo-agent/**/*.hnsw",
      ".repo-agent/**/*.vec",
      ".repo-agent/**/*.bin",
      ".repo-agent/**/*.tmp",
      ".repo-agent/**/*.temp",
      ".repo-agent/**/*.bak",
      ".repo-agent/**/*.swp",
      ".repo-agent/**/*.swo"
    ]
  },
  {
    title: "\u654F\u611F\u6587\u4EF6\uFF08\u793A\u4F8B\u6A21\u677F\u9664\u5916\uFF09",
    entries: [
      ".env",
      ".env.*",
      "!.env.example",
      "!.env.sample",
      "!.env.template",
      "!.env.*.example",
      "!.env.*.sample",
      "!.env.*.template",
      "*.pem",
      "*.key",
      "*.p12",
      "*.pfx",
      "id_rsa",
      "id_rsa.*",
      "!id_rsa.pub",
      "id_ed25519",
      "id_ed25519.*",
      "!id_ed25519.pub",
      "secrets.*",
      "!secrets.example.*",
      "*.secret",
      "*.secrets"
    ]
  },
  {
    title: "\u64CD\u4F5C\u7CFB\u7EDF\u4E34\u65F6\u6587\u4EF6",
    entries: [".DS_Store", "Thumbs.db"]
  }
];
var legacyHeaders = /* @__PURE__ */ new Set([
  "# repo-agent \u672C\u5730\u4E0E\u751F\u6210\u6587\u4EF6",
  ...gitignoreSections.map((section) => `# ${section.title}`)
]);
function renderManagedGitignore(eol = "\n") {
  const body = gitignoreSections.map((section) => [`# ${section.title}`, ...section.entries].join(eol)).join(`${eol}${eol}`);
  return [
    managedGitignoreStart,
    "# \u6B64\u533A\u5757\u7531 repo-agent \u81EA\u52A8\u7EF4\u62A4\uFF0C\u8BF7\u628A\u81EA\u5B9A\u4E49\u89C4\u5219\u5199\u5728\u533A\u5757\u4E4B\u5916\u3002",
    body,
    managedGitignoreEnd
  ].join(eol);
}
function stripManagedAndLegacyBlocks(content) {
  const lines = content.split(/\r?\n/);
  const kept = [];
  let inManaged = false;
  let inLegacy = false;
  for (const line of lines) {
    if (line.trim() === managedGitignoreStart) {
      inManaged = true;
      continue;
    }
    if (inManaged) {
      if (line.trim() === managedGitignoreEnd) inManaged = false;
      continue;
    }
    if (legacyHeaders.has(line.trim())) {
      inLegacy = true;
      continue;
    }
    if (inLegacy) {
      if (!line.trim()) inLegacy = false;
      continue;
    }
    kept.push(line);
  }
  while (kept.length && !kept.at(-1)?.trim()) kept.pop();
  return kept.join("\n");
}
async function ensureManagedGitignore(root, dryRun) {
  const gitignorePath = path5.join(root, ".gitignore");
  const fileExists = await exists(gitignorePath);
  const previous = fileExists ? await readFile2(gitignorePath, "utf8") : "";
  const eol = previous.includes("\r\n") ? "\r\n" : "\n";
  const userContent = stripManagedAndLegacyBlocks(previous).replaceAll("\n", eol);
  const next = `${userContent ? `${userContent}${eol}${eol}` : ""}${renderManagedGitignore(eol)}${eol}`;
  if (next === previous) return { action: "skipped", previous, next };
  if (dryRun) {
    return {
      action: fileExists ? "wouldUpdate" : "wouldCreate",
      previous,
      next
    };
  }
  await writeFile2(gitignorePath, next, "utf8");
  return { action: fileExists ? "updated" : "created", previous, next };
}
function gitignoreSuggestion() {
  return `${renderManagedGitignore()}
`;
}

// src/core/integration-manager.ts
import path8 from "node:path";
import { mkdir as mkdir2, readFile as readFile4, rm, rmdir, writeFile as writeFile3 } from "node:fs/promises";

// node_modules/jsonc-parser/lib/esm/impl/scanner.js
function createScanner(text, ignoreTrivia = false) {
  const len = text.length;
  let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
  function scanHexDigits(count, exact) {
    let digits = 0;
    let value2 = 0;
    while (digits < count || !exact) {
      let ch = text.charCodeAt(pos);
      if (ch >= 48 && ch <= 57) {
        value2 = value2 * 16 + ch - 48;
      } else if (ch >= 65 && ch <= 70) {
        value2 = value2 * 16 + ch - 65 + 10;
      } else if (ch >= 97 && ch <= 102) {
        value2 = value2 * 16 + ch - 97 + 10;
      } else {
        break;
      }
      pos++;
      digits++;
    }
    if (digits < count) {
      value2 = -1;
    }
    return value2;
  }
  function setPosition(newPosition) {
    pos = newPosition;
    value = "";
    tokenOffset = 0;
    token = 16;
    scanError = 0;
  }
  function scanNumber() {
    let start2 = pos;
    if (text.charCodeAt(pos) === 48) {
      pos++;
    } else {
      pos++;
      while (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
      }
    }
    if (pos < text.length && text.charCodeAt(pos) === 46) {
      pos++;
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
      } else {
        scanError = 3;
        return text.substring(start2, pos);
      }
    }
    let end2 = pos;
    if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
      pos++;
      if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) {
        pos++;
      }
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
        end2 = pos;
      } else {
        scanError = 3;
      }
    }
    return text.substring(start2, end2);
  }
  function scanString() {
    let result = "", start2 = pos;
    while (true) {
      if (pos >= len) {
        result += text.substring(start2, pos);
        scanError = 2;
        break;
      }
      const ch = text.charCodeAt(pos);
      if (ch === 34) {
        result += text.substring(start2, pos);
        pos++;
        break;
      }
      if (ch === 92) {
        result += text.substring(start2, pos);
        pos++;
        if (pos >= len) {
          scanError = 2;
          break;
        }
        const ch2 = text.charCodeAt(pos++);
        switch (ch2) {
          case 34:
            result += '"';
            break;
          case 92:
            result += "\\";
            break;
          case 47:
            result += "/";
            break;
          case 98:
            result += "\b";
            break;
          case 102:
            result += "\f";
            break;
          case 110:
            result += "\n";
            break;
          case 114:
            result += "\r";
            break;
          case 116:
            result += "	";
            break;
          case 117:
            const ch3 = scanHexDigits(4, true);
            if (ch3 >= 0) {
              result += String.fromCharCode(ch3);
            } else {
              scanError = 4;
            }
            break;
          default:
            scanError = 5;
        }
        start2 = pos;
        continue;
      }
      if (ch >= 0 && ch <= 31) {
        if (isLineBreak(ch)) {
          result += text.substring(start2, pos);
          scanError = 2;
          break;
        } else {
          scanError = 6;
        }
      }
      pos++;
    }
    return result;
  }
  function scanNext() {
    value = "";
    scanError = 0;
    tokenOffset = pos;
    lineStartOffset = lineNumber;
    prevTokenLineStartOffset = tokenLineStartOffset;
    if (pos >= len) {
      tokenOffset = len;
      return token = 17;
    }
    let code = text.charCodeAt(pos);
    if (isWhiteSpace(code)) {
      do {
        pos++;
        value += String.fromCharCode(code);
        code = text.charCodeAt(pos);
      } while (isWhiteSpace(code));
      return token = 15;
    }
    if (isLineBreak(code)) {
      pos++;
      value += String.fromCharCode(code);
      if (code === 13 && text.charCodeAt(pos) === 10) {
        pos++;
        value += "\n";
      }
      lineNumber++;
      tokenLineStartOffset = pos;
      return token = 14;
    }
    switch (code) {
      // tokens: []{}:,
      case 123:
        pos++;
        return token = 1;
      case 125:
        pos++;
        return token = 2;
      case 91:
        pos++;
        return token = 3;
      case 93:
        pos++;
        return token = 4;
      case 58:
        pos++;
        return token = 6;
      case 44:
        pos++;
        return token = 5;
      // strings
      case 34:
        pos++;
        value = scanString();
        return token = 10;
      // comments
      case 47:
        const start2 = pos - 1;
        if (text.charCodeAt(pos + 1) === 47) {
          pos += 2;
          while (pos < len) {
            if (isLineBreak(text.charCodeAt(pos))) {
              break;
            }
            pos++;
          }
          value = text.substring(start2, pos);
          return token = 12;
        }
        if (text.charCodeAt(pos + 1) === 42) {
          pos += 2;
          const safeLength = len - 1;
          let commentClosed = false;
          while (pos < safeLength) {
            const ch = text.charCodeAt(pos);
            if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
              pos += 2;
              commentClosed = true;
              break;
            }
            pos++;
            if (isLineBreak(ch)) {
              if (ch === 13 && text.charCodeAt(pos) === 10) {
                pos++;
              }
              lineNumber++;
              tokenLineStartOffset = pos;
            }
          }
          if (!commentClosed) {
            pos++;
            scanError = 1;
          }
          value = text.substring(start2, pos);
          return token = 13;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
      // numbers
      case 45:
        value += String.fromCharCode(code);
        pos++;
        if (pos === len || !isDigit(text.charCodeAt(pos))) {
          return token = 16;
        }
      // found a minus, followed by a number so
      // we fall through to proceed with scanning
      // numbers
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        value += scanNumber();
        return token = 11;
      // literals and unknown symbols
      default:
        while (pos < len && isUnknownContentCharacter(code)) {
          pos++;
          code = text.charCodeAt(pos);
        }
        if (tokenOffset !== pos) {
          value = text.substring(tokenOffset, pos);
          switch (value) {
            case "true":
              return token = 8;
            case "false":
              return token = 9;
            case "null":
              return token = 7;
          }
          return token = 16;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
    }
  }
  function isUnknownContentCharacter(code) {
    if (isWhiteSpace(code) || isLineBreak(code)) {
      return false;
    }
    switch (code) {
      case 125:
      case 93:
      case 123:
      case 91:
      case 34:
      case 58:
      case 44:
      case 47:
        return false;
    }
    return true;
  }
  function scanNextNonTrivia() {
    let result;
    do {
      result = scanNext();
    } while (result >= 12 && result <= 15);
    return result;
  }
  return {
    setPosition,
    getPosition: () => pos,
    scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
    getToken: () => token,
    getTokenValue: () => value,
    getTokenOffset: () => tokenOffset,
    getTokenLength: () => pos - tokenOffset,
    getTokenStartLine: () => lineStartOffset,
    getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
    getTokenError: () => scanError
  };
}
function isWhiteSpace(ch) {
  return ch === 32 || ch === 9;
}
function isLineBreak(ch) {
  return ch === 10 || ch === 13;
}
function isDigit(ch) {
  return ch >= 48 && ch <= 57;
}
var CharacterCodes;
(function(CharacterCodes2) {
  CharacterCodes2[CharacterCodes2["lineFeed"] = 10] = "lineFeed";
  CharacterCodes2[CharacterCodes2["carriageReturn"] = 13] = "carriageReturn";
  CharacterCodes2[CharacterCodes2["space"] = 32] = "space";
  CharacterCodes2[CharacterCodes2["_0"] = 48] = "_0";
  CharacterCodes2[CharacterCodes2["_1"] = 49] = "_1";
  CharacterCodes2[CharacterCodes2["_2"] = 50] = "_2";
  CharacterCodes2[CharacterCodes2["_3"] = 51] = "_3";
  CharacterCodes2[CharacterCodes2["_4"] = 52] = "_4";
  CharacterCodes2[CharacterCodes2["_5"] = 53] = "_5";
  CharacterCodes2[CharacterCodes2["_6"] = 54] = "_6";
  CharacterCodes2[CharacterCodes2["_7"] = 55] = "_7";
  CharacterCodes2[CharacterCodes2["_8"] = 56] = "_8";
  CharacterCodes2[CharacterCodes2["_9"] = 57] = "_9";
  CharacterCodes2[CharacterCodes2["a"] = 97] = "a";
  CharacterCodes2[CharacterCodes2["b"] = 98] = "b";
  CharacterCodes2[CharacterCodes2["c"] = 99] = "c";
  CharacterCodes2[CharacterCodes2["d"] = 100] = "d";
  CharacterCodes2[CharacterCodes2["e"] = 101] = "e";
  CharacterCodes2[CharacterCodes2["f"] = 102] = "f";
  CharacterCodes2[CharacterCodes2["g"] = 103] = "g";
  CharacterCodes2[CharacterCodes2["h"] = 104] = "h";
  CharacterCodes2[CharacterCodes2["i"] = 105] = "i";
  CharacterCodes2[CharacterCodes2["j"] = 106] = "j";
  CharacterCodes2[CharacterCodes2["k"] = 107] = "k";
  CharacterCodes2[CharacterCodes2["l"] = 108] = "l";
  CharacterCodes2[CharacterCodes2["m"] = 109] = "m";
  CharacterCodes2[CharacterCodes2["n"] = 110] = "n";
  CharacterCodes2[CharacterCodes2["o"] = 111] = "o";
  CharacterCodes2[CharacterCodes2["p"] = 112] = "p";
  CharacterCodes2[CharacterCodes2["q"] = 113] = "q";
  CharacterCodes2[CharacterCodes2["r"] = 114] = "r";
  CharacterCodes2[CharacterCodes2["s"] = 115] = "s";
  CharacterCodes2[CharacterCodes2["t"] = 116] = "t";
  CharacterCodes2[CharacterCodes2["u"] = 117] = "u";
  CharacterCodes2[CharacterCodes2["v"] = 118] = "v";
  CharacterCodes2[CharacterCodes2["w"] = 119] = "w";
  CharacterCodes2[CharacterCodes2["x"] = 120] = "x";
  CharacterCodes2[CharacterCodes2["y"] = 121] = "y";
  CharacterCodes2[CharacterCodes2["z"] = 122] = "z";
  CharacterCodes2[CharacterCodes2["A"] = 65] = "A";
  CharacterCodes2[CharacterCodes2["B"] = 66] = "B";
  CharacterCodes2[CharacterCodes2["C"] = 67] = "C";
  CharacterCodes2[CharacterCodes2["D"] = 68] = "D";
  CharacterCodes2[CharacterCodes2["E"] = 69] = "E";
  CharacterCodes2[CharacterCodes2["F"] = 70] = "F";
  CharacterCodes2[CharacterCodes2["G"] = 71] = "G";
  CharacterCodes2[CharacterCodes2["H"] = 72] = "H";
  CharacterCodes2[CharacterCodes2["I"] = 73] = "I";
  CharacterCodes2[CharacterCodes2["J"] = 74] = "J";
  CharacterCodes2[CharacterCodes2["K"] = 75] = "K";
  CharacterCodes2[CharacterCodes2["L"] = 76] = "L";
  CharacterCodes2[CharacterCodes2["M"] = 77] = "M";
  CharacterCodes2[CharacterCodes2["N"] = 78] = "N";
  CharacterCodes2[CharacterCodes2["O"] = 79] = "O";
  CharacterCodes2[CharacterCodes2["P"] = 80] = "P";
  CharacterCodes2[CharacterCodes2["Q"] = 81] = "Q";
  CharacterCodes2[CharacterCodes2["R"] = 82] = "R";
  CharacterCodes2[CharacterCodes2["S"] = 83] = "S";
  CharacterCodes2[CharacterCodes2["T"] = 84] = "T";
  CharacterCodes2[CharacterCodes2["U"] = 85] = "U";
  CharacterCodes2[CharacterCodes2["V"] = 86] = "V";
  CharacterCodes2[CharacterCodes2["W"] = 87] = "W";
  CharacterCodes2[CharacterCodes2["X"] = 88] = "X";
  CharacterCodes2[CharacterCodes2["Y"] = 89] = "Y";
  CharacterCodes2[CharacterCodes2["Z"] = 90] = "Z";
  CharacterCodes2[CharacterCodes2["asterisk"] = 42] = "asterisk";
  CharacterCodes2[CharacterCodes2["backslash"] = 92] = "backslash";
  CharacterCodes2[CharacterCodes2["closeBrace"] = 125] = "closeBrace";
  CharacterCodes2[CharacterCodes2["closeBracket"] = 93] = "closeBracket";
  CharacterCodes2[CharacterCodes2["colon"] = 58] = "colon";
  CharacterCodes2[CharacterCodes2["comma"] = 44] = "comma";
  CharacterCodes2[CharacterCodes2["dot"] = 46] = "dot";
  CharacterCodes2[CharacterCodes2["doubleQuote"] = 34] = "doubleQuote";
  CharacterCodes2[CharacterCodes2["minus"] = 45] = "minus";
  CharacterCodes2[CharacterCodes2["openBrace"] = 123] = "openBrace";
  CharacterCodes2[CharacterCodes2["openBracket"] = 91] = "openBracket";
  CharacterCodes2[CharacterCodes2["plus"] = 43] = "plus";
  CharacterCodes2[CharacterCodes2["slash"] = 47] = "slash";
  CharacterCodes2[CharacterCodes2["formFeed"] = 12] = "formFeed";
  CharacterCodes2[CharacterCodes2["tab"] = 9] = "tab";
})(CharacterCodes || (CharacterCodes = {}));

// node_modules/jsonc-parser/lib/esm/impl/string-intern.js
var cachedSpaces = new Array(20).fill(0).map((_, index) => {
  return " ".repeat(index);
});
var maxCachedValues = 200;
var cachedBreakLinesWithSpaces = {
  " ": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\n" + " ".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + " ".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r\n" + " ".repeat(index);
    })
  },
  "	": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\n" + "	".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + "	".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r\n" + "	".repeat(index);
    })
  }
};
var supportedEols = ["\n", "\r", "\r\n"];

// node_modules/jsonc-parser/lib/esm/impl/format.js
function format(documentText, range, options) {
  let initialIndentLevel;
  let formatText;
  let formatTextStart;
  let rangeStart;
  let rangeEnd;
  if (range) {
    rangeStart = range.offset;
    rangeEnd = rangeStart + range.length;
    formatTextStart = rangeStart;
    while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) {
      formatTextStart--;
    }
    let endOffset = rangeEnd;
    while (endOffset < documentText.length && !isEOL(documentText, endOffset)) {
      endOffset++;
    }
    formatText = documentText.substring(formatTextStart, endOffset);
    initialIndentLevel = computeIndentLevel(formatText, options);
  } else {
    formatText = documentText;
    initialIndentLevel = 0;
    formatTextStart = 0;
    rangeStart = 0;
    rangeEnd = documentText.length;
  }
  const eol = getEOL(options, documentText);
  const eolFastPathSupported = supportedEols.includes(eol);
  let numberLineBreaks = 0;
  let indentLevel = 0;
  let indentValue;
  if (options.insertSpaces) {
    indentValue = cachedSpaces[options.tabSize || 4] ?? repeat(cachedSpaces[1], options.tabSize || 4);
  } else {
    indentValue = "	";
  }
  const indentType = indentValue === "	" ? "	" : " ";
  let scanner = createScanner(formatText, false);
  let hasError = false;
  function newLinesAndIndent() {
    if (numberLineBreaks > 1) {
      return repeat(eol, numberLineBreaks) + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    const amountOfSpaces = indentValue.length * (initialIndentLevel + indentLevel);
    if (!eolFastPathSupported || amountOfSpaces > cachedBreakLinesWithSpaces[indentType][eol].length) {
      return eol + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    if (amountOfSpaces <= 0) {
      return eol;
    }
    return cachedBreakLinesWithSpaces[indentType][eol][amountOfSpaces];
  }
  function scanNext() {
    let token = scanner.scan();
    numberLineBreaks = 0;
    while (token === 15 || token === 14) {
      if (token === 14 && options.keepLines) {
        numberLineBreaks += 1;
      } else if (token === 14) {
        numberLineBreaks = 1;
      }
      token = scanner.scan();
    }
    hasError = token === 16 || scanner.getTokenError() !== 0;
    return token;
  }
  const editOperations = [];
  function addEdit(text, startOffset, endOffset) {
    if (!hasError && (!range || startOffset < rangeEnd && endOffset > rangeStart) && documentText.substring(startOffset, endOffset) !== text) {
      editOperations.push({ offset: startOffset, length: endOffset - startOffset, content: text });
    }
  }
  let firstToken = scanNext();
  if (options.keepLines && numberLineBreaks > 0) {
    addEdit(repeat(eol, numberLineBreaks), 0, 0);
  }
  if (firstToken !== 17) {
    let firstTokenStart = scanner.getTokenOffset() + formatTextStart;
    let initialIndent = indentValue.length * initialIndentLevel < 20 && options.insertSpaces ? cachedSpaces[indentValue.length * initialIndentLevel] : repeat(indentValue, initialIndentLevel);
    addEdit(initialIndent, formatTextStart, firstTokenStart);
  }
  while (firstToken !== 17) {
    let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
    let secondToken = scanNext();
    let replaceContent = "";
    let needsLineBreak = false;
    while (numberLineBreaks === 0 && (secondToken === 12 || secondToken === 13)) {
      let commentTokenStart = scanner.getTokenOffset() + formatTextStart;
      addEdit(cachedSpaces[1], firstTokenEnd, commentTokenStart);
      firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
      needsLineBreak = secondToken === 12;
      replaceContent = needsLineBreak ? newLinesAndIndent() : "";
      secondToken = scanNext();
    }
    if (secondToken === 2) {
      if (firstToken !== 1) {
        indentLevel--;
      }
      ;
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 1) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else if (secondToken === 4) {
      if (firstToken !== 3) {
        indentLevel--;
      }
      ;
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 3) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else {
      switch (firstToken) {
        case 3:
        case 1:
          indentLevel++;
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 5:
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 12:
          replaceContent = newLinesAndIndent();
          break;
        case 13:
          if (numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 6:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 10:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (secondToken === 6 && !needsLineBreak) {
            replaceContent = "";
          }
          break;
        case 7:
        case 8:
        case 9:
        case 11:
        case 2:
        case 4:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else {
            if ((secondToken === 12 || secondToken === 13) && !needsLineBreak) {
              replaceContent = cachedSpaces[1];
            } else if (secondToken !== 5 && secondToken !== 17) {
              hasError = true;
            }
          }
          break;
        case 16:
          hasError = true;
          break;
      }
      if (numberLineBreaks > 0 && (secondToken === 12 || secondToken === 13)) {
        replaceContent = newLinesAndIndent();
      }
    }
    if (secondToken === 17) {
      if (options.keepLines && numberLineBreaks > 0) {
        replaceContent = newLinesAndIndent();
      } else {
        replaceContent = options.insertFinalNewline ? eol : "";
      }
    }
    const secondTokenStart = scanner.getTokenOffset() + formatTextStart;
    addEdit(replaceContent, firstTokenEnd, secondTokenStart);
    firstToken = secondToken;
  }
  return editOperations;
}
function repeat(s, count) {
  let result = "";
  for (let i2 = 0; i2 < count; i2++) {
    result += s;
  }
  return result;
}
function computeIndentLevel(content, options) {
  let i2 = 0;
  let nChars = 0;
  const tabSize = options.tabSize || 4;
  while (i2 < content.length) {
    let ch = content.charAt(i2);
    if (ch === cachedSpaces[1]) {
      nChars++;
    } else if (ch === "	") {
      nChars += tabSize;
    } else {
      break;
    }
    i2++;
  }
  return Math.floor(nChars / tabSize);
}
function getEOL(options, text) {
  for (let i2 = 0; i2 < text.length; i2++) {
    const ch = text.charAt(i2);
    if (ch === "\r") {
      if (i2 + 1 < text.length && text.charAt(i2 + 1) === "\n") {
        return "\r\n";
      }
      return "\r";
    } else if (ch === "\n") {
      return "\n";
    }
  }
  return options && options.eol || "\n";
}
function isEOL(text, offset) {
  return "\r\n".indexOf(text.charAt(offset)) !== -1;
}

// node_modules/jsonc-parser/lib/esm/impl/parser.js
var ParseOptions;
(function(ParseOptions2) {
  ParseOptions2.DEFAULT = {
    allowTrailingComma: false
  };
})(ParseOptions || (ParseOptions = {}));
function parse(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentProperty = null;
  let currentParent = [];
  const previousParents = [];
  function onValue(value) {
    if (Array.isArray(currentParent)) {
      currentParent.push(value);
    } else if (currentProperty !== null) {
      currentParent[currentProperty] = value;
    }
  }
  const visitor = {
    onObjectBegin: () => {
      const object = {};
      onValue(object);
      previousParents.push(currentParent);
      currentParent = object;
      currentProperty = null;
    },
    onObjectProperty: (name) => {
      currentProperty = name;
    },
    onObjectEnd: () => {
      currentParent = previousParents.pop();
    },
    onArrayBegin: () => {
      const array = [];
      onValue(array);
      previousParents.push(currentParent);
      currentParent = array;
      currentProperty = null;
    },
    onArrayEnd: () => {
      currentParent = previousParents.pop();
    },
    onLiteralValue: onValue,
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  return currentParent[0];
}
function parseTree(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentParent = { type: "array", offset: -1, length: -1, children: [], parent: void 0 };
  function ensurePropertyComplete(endOffset) {
    if (currentParent.type === "property") {
      currentParent.length = endOffset - currentParent.offset;
      currentParent = currentParent.parent;
    }
  }
  function onValue(valueNode) {
    currentParent.children.push(valueNode);
    return valueNode;
  }
  const visitor = {
    onObjectBegin: (offset) => {
      currentParent = onValue({ type: "object", offset, length: -1, parent: currentParent, children: [] });
    },
    onObjectProperty: (name, offset, length) => {
      currentParent = onValue({ type: "property", offset, length: -1, parent: currentParent, children: [] });
      currentParent.children.push({ type: "string", value: name, offset, length, parent: currentParent });
    },
    onObjectEnd: (offset, length) => {
      ensurePropertyComplete(offset + length);
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onArrayBegin: (offset, length) => {
      currentParent = onValue({ type: "array", offset, length: -1, parent: currentParent, children: [] });
    },
    onArrayEnd: (offset, length) => {
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onLiteralValue: (value, offset, length) => {
      onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
      ensurePropertyComplete(offset + length);
    },
    onSeparator: (sep2, offset, length) => {
      if (currentParent.type === "property") {
        if (sep2 === ":") {
          currentParent.colonOffset = offset;
        } else if (sep2 === ",") {
          ensurePropertyComplete(offset);
        }
      }
    },
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  const result = currentParent.children[0];
  if (result) {
    delete result.parent;
  }
  return result;
}
function findNodeAtLocation(root, path39) {
  if (!root) {
    return void 0;
  }
  let node = root;
  for (let segment of path39) {
    if (typeof segment === "string") {
      if (node.type !== "object" || !Array.isArray(node.children)) {
        return void 0;
      }
      let found = false;
      for (const propertyNode of node.children) {
        if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === segment && propertyNode.children.length === 2) {
          node = propertyNode.children[1];
          found = true;
          break;
        }
      }
      if (!found) {
        return void 0;
      }
    } else {
      const index = segment;
      if (node.type !== "array" || index < 0 || !Array.isArray(node.children) || index >= node.children.length) {
        return void 0;
      }
      node = node.children[index];
    }
  }
  return node;
}
function visit(text, visitor, options = ParseOptions.DEFAULT) {
  const _scanner = createScanner(text, false);
  const _jsonPath = [];
  let suppressedCallbacks = 0;
  function toNoArgVisit(visitFunction) {
    return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisit(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisitWithPath(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
  }
  function toBeginVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks++;
      } else {
        let cbReturn = visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice());
        if (cbReturn === false) {
          suppressedCallbacks = 1;
        }
      }
    } : () => true;
  }
  function toEndVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks--;
      }
      if (suppressedCallbacks === 0) {
        visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
      }
    } : () => true;
  }
  const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
  const disallowComments = options && options.disallowComments;
  const allowTrailingComma = options && options.allowTrailingComma;
  function scanNext() {
    while (true) {
      const token = _scanner.scan();
      switch (_scanner.getTokenError()) {
        case 4:
          handleError(
            14
            /* ParseErrorCode.InvalidUnicode */
          );
          break;
        case 5:
          handleError(
            15
            /* ParseErrorCode.InvalidEscapeCharacter */
          );
          break;
        case 3:
          handleError(
            13
            /* ParseErrorCode.UnexpectedEndOfNumber */
          );
          break;
        case 1:
          if (!disallowComments) {
            handleError(
              11
              /* ParseErrorCode.UnexpectedEndOfComment */
            );
          }
          break;
        case 2:
          handleError(
            12
            /* ParseErrorCode.UnexpectedEndOfString */
          );
          break;
        case 6:
          handleError(
            16
            /* ParseErrorCode.InvalidCharacter */
          );
          break;
      }
      switch (token) {
        case 12:
        case 13:
          if (disallowComments) {
            handleError(
              10
              /* ParseErrorCode.InvalidCommentToken */
            );
          } else {
            onComment();
          }
          break;
        case 16:
          handleError(
            1
            /* ParseErrorCode.InvalidSymbol */
          );
          break;
        case 15:
        case 14:
          break;
        default:
          return token;
      }
    }
  }
  function handleError(error, skipUntilAfter = [], skipUntil = []) {
    onError(error);
    if (skipUntilAfter.length + skipUntil.length > 0) {
      let token = _scanner.getToken();
      while (token !== 17) {
        if (skipUntilAfter.indexOf(token) !== -1) {
          scanNext();
          break;
        } else if (skipUntil.indexOf(token) !== -1) {
          break;
        }
        token = scanNext();
      }
    }
  }
  function parseString(isValue) {
    const value = _scanner.getTokenValue();
    if (isValue) {
      onLiteralValue(value);
    } else {
      onObjectProperty(value);
      _jsonPath.push(value);
    }
    scanNext();
    return true;
  }
  function parseLiteral() {
    switch (_scanner.getToken()) {
      case 11:
        const tokenValue = _scanner.getTokenValue();
        let value = Number(tokenValue);
        if (isNaN(value)) {
          handleError(
            2
            /* ParseErrorCode.InvalidNumberFormat */
          );
          value = 0;
        }
        onLiteralValue(value);
        break;
      case 7:
        onLiteralValue(null);
        break;
      case 8:
        onLiteralValue(true);
        break;
      case 9:
        onLiteralValue(false);
        break;
      default:
        return false;
    }
    scanNext();
    return true;
  }
  function parseProperty() {
    if (_scanner.getToken() !== 10) {
      handleError(3, [], [
        2,
        5
        /* SyntaxKind.CommaToken */
      ]);
      return false;
    }
    parseString(false);
    if (_scanner.getToken() === 6) {
      onSeparator(":");
      scanNext();
      if (!parseValue()) {
        handleError(4, [], [
          2,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
    } else {
      handleError(5, [], [
        2,
        5
        /* SyntaxKind.CommaToken */
      ]);
    }
    _jsonPath.pop();
    return true;
  }
  function parseObject() {
    onObjectBegin();
    scanNext();
    let needsComma = false;
    while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 2 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (!parseProperty()) {
        handleError(4, [], [
          2,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
      needsComma = true;
    }
    onObjectEnd();
    if (_scanner.getToken() !== 2) {
      handleError(7, [
        2
        /* SyntaxKind.CloseBraceToken */
      ], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseArray() {
    onArrayBegin();
    scanNext();
    let isFirstElement = true;
    let needsComma = false;
    while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 4 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (isFirstElement) {
        _jsonPath.push(0);
        isFirstElement = false;
      } else {
        _jsonPath[_jsonPath.length - 1]++;
      }
      if (!parseValue()) {
        handleError(4, [], [
          4,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
      needsComma = true;
    }
    onArrayEnd();
    if (!isFirstElement) {
      _jsonPath.pop();
    }
    if (_scanner.getToken() !== 4) {
      handleError(8, [
        4
        /* SyntaxKind.CloseBracketToken */
      ], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseValue() {
    switch (_scanner.getToken()) {
      case 3:
        return parseArray();
      case 1:
        return parseObject();
      case 10:
        return parseString(true);
      default:
        return parseLiteral();
    }
  }
  scanNext();
  if (_scanner.getToken() === 17) {
    if (options.allowEmptyContent) {
      return true;
    }
    handleError(4, [], []);
    return false;
  }
  if (!parseValue()) {
    handleError(4, [], []);
    return false;
  }
  if (_scanner.getToken() !== 17) {
    handleError(9, [], []);
  }
  return true;
}
function getNodeType(value) {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "object": {
      if (!value) {
        return "null";
      } else if (Array.isArray(value)) {
        return "array";
      }
      return "object";
    }
    default:
      return "null";
  }
}

// node_modules/jsonc-parser/lib/esm/impl/edit.js
function setProperty(text, originalPath, value, options) {
  const path39 = originalPath.slice();
  const errors = [];
  const root = parseTree(text, errors);
  let parent = void 0;
  let lastSegment = void 0;
  while (path39.length > 0) {
    lastSegment = path39.pop();
    parent = findNodeAtLocation(root, path39);
    if (parent === void 0 && value !== void 0) {
      if (typeof lastSegment === "string") {
        value = { [lastSegment]: value };
      } else {
        value = [value];
      }
    } else {
      break;
    }
  }
  if (!parent) {
    if (value === void 0) {
      throw new Error("Can not delete in empty document");
    }
    return withFormatting(text, { offset: root ? root.offset : 0, length: root ? root.length : 0, content: JSON.stringify(value) }, options);
  } else if (parent.type === "object" && typeof lastSegment === "string" && Array.isArray(parent.children)) {
    const existing = findNodeAtLocation(parent, [lastSegment]);
    if (existing !== void 0) {
      if (value === void 0) {
        if (!existing.parent) {
          throw new Error("Malformed AST");
        }
        const propertyIndex = parent.children.indexOf(existing.parent);
        let removeBegin;
        let removeEnd = existing.parent.offset + existing.parent.length;
        if (propertyIndex > 0) {
          let previous = parent.children[propertyIndex - 1];
          removeBegin = previous.offset + previous.length;
        } else {
          removeBegin = parent.offset + 1;
          if (parent.children.length > 1) {
            let next = parent.children[1];
            removeEnd = next.offset;
          }
        }
        return withFormatting(text, { offset: removeBegin, length: removeEnd - removeBegin, content: "" }, options);
      } else {
        return withFormatting(text, { offset: existing.offset, length: existing.length, content: JSON.stringify(value) }, options);
      }
    } else {
      if (value === void 0) {
        return [];
      }
      const newProperty = `${JSON.stringify(lastSegment)}: ${JSON.stringify(value)}`;
      const index = options.getInsertionIndex ? options.getInsertionIndex(parent.children.map((p) => p.children[0].value)) : parent.children.length;
      let edit;
      if (index > 0) {
        let previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      } else if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty + "," };
      }
      return withFormatting(text, edit, options);
    }
  } else if (parent.type === "array" && typeof lastSegment === "number" && Array.isArray(parent.children)) {
    const insertIndex = lastSegment;
    if (insertIndex === -1) {
      const newProperty = `${JSON.stringify(value)}`;
      let edit;
      if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        const previous = parent.children[parent.children.length - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else if (value === void 0 && parent.children.length >= 0) {
      const removalIndex = lastSegment;
      const toRemove = parent.children[removalIndex];
      let edit;
      if (parent.children.length === 1) {
        edit = { offset: parent.offset + 1, length: parent.length - 2, content: "" };
      } else if (parent.children.length - 1 === removalIndex) {
        let previous = parent.children[removalIndex - 1];
        let offset = previous.offset + previous.length;
        let parentEndOffset = parent.offset + parent.length;
        edit = { offset, length: parentEndOffset - 2 - offset, content: "" };
      } else {
        edit = { offset: toRemove.offset, length: parent.children[removalIndex + 1].offset - toRemove.offset, content: "" };
      }
      return withFormatting(text, edit, options);
    } else if (value !== void 0) {
      let edit;
      const newProperty = `${JSON.stringify(value)}`;
      if (!options.isArrayInsertion && parent.children.length > lastSegment) {
        const toModify = parent.children[lastSegment];
        edit = { offset: toModify.offset, length: toModify.length, content: newProperty };
      } else if (parent.children.length === 0 || lastSegment === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: parent.children.length === 0 ? newProperty : newProperty + "," };
      } else {
        const index = lastSegment > parent.children.length ? parent.children.length : lastSegment;
        const previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else {
      throw new Error(`Can not ${value === void 0 ? "remove" : options.isArrayInsertion ? "insert" : "modify"} Array index ${insertIndex} as length is not sufficient`);
    }
  } else {
    throw new Error(`Can not add ${typeof lastSegment !== "number" ? "index" : "property"} to parent of type ${parent.type}`);
  }
}
function withFormatting(text, edit, options) {
  if (!options.formattingOptions) {
    return [edit];
  }
  let newText = applyEdit(text, edit);
  let begin = edit.offset;
  let end2 = edit.offset + edit.content.length;
  if (edit.length === 0 || edit.content.length === 0) {
    while (begin > 0 && !isEOL(newText, begin - 1)) {
      begin--;
    }
    while (end2 < newText.length && !isEOL(newText, end2)) {
      end2++;
    }
  }
  const edits = format(newText, { offset: begin, length: end2 - begin }, { ...options.formattingOptions, keepLines: false });
  for (let i2 = edits.length - 1; i2 >= 0; i2--) {
    const edit2 = edits[i2];
    newText = applyEdit(newText, edit2);
    begin = Math.min(begin, edit2.offset);
    end2 = Math.max(end2, edit2.offset + edit2.length);
    end2 += edit2.content.length - edit2.length;
  }
  const editLength = text.length - (newText.length - end2) - begin;
  return [{ offset: begin, length: editLength, content: newText.substring(begin, end2) }];
}
function applyEdit(text, edit) {
  return text.substring(0, edit.offset) + edit.content + text.substring(edit.offset + edit.length);
}

// node_modules/jsonc-parser/lib/esm/main.js
var ScanError;
(function(ScanError2) {
  ScanError2[ScanError2["None"] = 0] = "None";
  ScanError2[ScanError2["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
  ScanError2[ScanError2["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
  ScanError2[ScanError2["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
  ScanError2[ScanError2["InvalidUnicode"] = 4] = "InvalidUnicode";
  ScanError2[ScanError2["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
  ScanError2[ScanError2["InvalidCharacter"] = 6] = "InvalidCharacter";
})(ScanError || (ScanError = {}));
var SyntaxKind;
(function(SyntaxKind2) {
  SyntaxKind2[SyntaxKind2["OpenBraceToken"] = 1] = "OpenBraceToken";
  SyntaxKind2[SyntaxKind2["CloseBraceToken"] = 2] = "CloseBraceToken";
  SyntaxKind2[SyntaxKind2["OpenBracketToken"] = 3] = "OpenBracketToken";
  SyntaxKind2[SyntaxKind2["CloseBracketToken"] = 4] = "CloseBracketToken";
  SyntaxKind2[SyntaxKind2["CommaToken"] = 5] = "CommaToken";
  SyntaxKind2[SyntaxKind2["ColonToken"] = 6] = "ColonToken";
  SyntaxKind2[SyntaxKind2["NullKeyword"] = 7] = "NullKeyword";
  SyntaxKind2[SyntaxKind2["TrueKeyword"] = 8] = "TrueKeyword";
  SyntaxKind2[SyntaxKind2["FalseKeyword"] = 9] = "FalseKeyword";
  SyntaxKind2[SyntaxKind2["StringLiteral"] = 10] = "StringLiteral";
  SyntaxKind2[SyntaxKind2["NumericLiteral"] = 11] = "NumericLiteral";
  SyntaxKind2[SyntaxKind2["LineCommentTrivia"] = 12] = "LineCommentTrivia";
  SyntaxKind2[SyntaxKind2["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
  SyntaxKind2[SyntaxKind2["LineBreakTrivia"] = 14] = "LineBreakTrivia";
  SyntaxKind2[SyntaxKind2["Trivia"] = 15] = "Trivia";
  SyntaxKind2[SyntaxKind2["Unknown"] = 16] = "Unknown";
  SyntaxKind2[SyntaxKind2["EOF"] = 17] = "EOF";
})(SyntaxKind || (SyntaxKind = {}));
var parse2 = parse;
var ParseErrorCode;
(function(ParseErrorCode2) {
  ParseErrorCode2[ParseErrorCode2["InvalidSymbol"] = 1] = "InvalidSymbol";
  ParseErrorCode2[ParseErrorCode2["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
  ParseErrorCode2[ParseErrorCode2["PropertyNameExpected"] = 3] = "PropertyNameExpected";
  ParseErrorCode2[ParseErrorCode2["ValueExpected"] = 4] = "ValueExpected";
  ParseErrorCode2[ParseErrorCode2["ColonExpected"] = 5] = "ColonExpected";
  ParseErrorCode2[ParseErrorCode2["CommaExpected"] = 6] = "CommaExpected";
  ParseErrorCode2[ParseErrorCode2["CloseBraceExpected"] = 7] = "CloseBraceExpected";
  ParseErrorCode2[ParseErrorCode2["CloseBracketExpected"] = 8] = "CloseBracketExpected";
  ParseErrorCode2[ParseErrorCode2["EndOfFileExpected"] = 9] = "EndOfFileExpected";
  ParseErrorCode2[ParseErrorCode2["InvalidCommentToken"] = 10] = "InvalidCommentToken";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
  ParseErrorCode2[ParseErrorCode2["InvalidUnicode"] = 14] = "InvalidUnicode";
  ParseErrorCode2[ParseErrorCode2["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
  ParseErrorCode2[ParseErrorCode2["InvalidCharacter"] = 16] = "InvalidCharacter";
})(ParseErrorCode || (ParseErrorCode = {}));
function modify(text, path39, value, options) {
  return setProperty(text, path39, value, options);
}
function applyEdits(text, edits) {
  let sortedEdits = edits.slice(0).sort((a, b) => {
    const diff = a.offset - b.offset;
    if (diff === 0) {
      return a.length - b.length;
    }
    return diff;
  });
  let lastModifiedOffset = text.length;
  for (let i2 = sortedEdits.length - 1; i2 >= 0; i2--) {
    let e = sortedEdits[i2];
    if (e.offset + e.length <= lastModifiedOffset) {
      text = applyEdit(text, e);
    } else {
      throw new Error("Overlapping edit");
    }
    lastModifiedOffset = e.offset;
  }
  return text;
}

// src/adapters/registry.ts
import path6 from "node:path";
import { execFile as execFile2 } from "node:child_process";
import { promisify as promisify2 } from "node:util";
var execFileAsync2 = promisify2(execFile2);
var definitions = [
  {
    id: "codex",
    displayName: "Codex",
    executables: ["codex"],
    configFiles: [".codex/config.toml", ".codex/hooks.json"],
    capabilities: {
      supportsMcp: true,
      supportsHooks: true,
      supportsPlugin: false,
      supportsSessionStartHook: true,
      supportsUserPromptSubmitHook: true,
      supportsStopHook: true,
      supportsBlockingHook: true,
      supportsWindowsCommandOverride: true,
      defaultEntry: "hook"
    }
  },
  {
    id: "claude-code",
    displayName: "Claude Code",
    executables: ["claude"],
    configFiles: [".mcp.json", ".claude/settings.json"],
    capabilities: {
      supportsMcp: true,
      supportsHooks: true,
      supportsPlugin: false,
      supportsSessionStartHook: true,
      supportsUserPromptSubmitHook: true,
      supportsStopHook: true,
      supportsBlockingHook: true,
      supportsWindowsCommandOverride: false,
      defaultEntry: "hook"
    }
  },
  {
    id: "opencode",
    displayName: "OpenCode",
    executables: ["opencode"],
    configFiles: ["opencode.json"],
    capabilities: {
      supportsMcp: true,
      supportsHooks: false,
      supportsPlugin: true,
      supportsSessionStartHook: true,
      supportsUserPromptSubmitHook: true,
      supportsStopHook: true,
      supportsBlockingHook: true,
      supportsWindowsCommandOverride: false,
      defaultEntry: "plugin"
    }
  }
];
var toolAdapters = definitions.map((definition) => ({
  ...definition,
  async detect(projectRoot) {
    const projectConfigured = await Promise.any(
      definition.configFiles.map(async (file) => {
        if (await exists(path6.join(projectRoot, file))) return true;
        throw new Error("missing");
      })
    ).catch(() => false);
    const installed = await Promise.any(
      definition.executables.map(async (executable) => {
        await execFileAsync2(
          process.platform === "win32" ? "where" : "which",
          [executable]
        );
        return true;
      })
    ).catch(() => false);
    return {
      installed: installed || projectConfigured,
      projectConfigured
    };
  }
}));
function getToolAdapter(id) {
  return toolAdapters.find((adapter) => adapter.id === id);
}
async function selectToolAdapters(root, selection) {
  if (selection === "all") return toolAdapters;
  if (selection !== "auto") return [getToolAdapter(selection)];
  const detected = await Promise.all(
    toolAdapters.map(async (adapter) => ({
      adapter,
      detection: await adapter.detect(root)
    }))
  );
  return detected.filter(
    ({ detection }) => detection.installed || detection.projectConfigured
  ).map(({ adapter }) => adapter);
}

// src/core/hook-router.ts
import path7 from "node:path";

// src/utils/yaml.ts
var import_yaml = __toESM(require_dist(), 1);
import { readFile as readFile3 } from "node:fs/promises";
async function readYaml(filePath) {
  try {
    return (0, import_yaml.parse)(await readFile3(filePath, "utf8"));
  } catch (error) {
    throw new CliError(
      "E_CONFIG_PARSE",
      `\u89E3\u6790 ${filePath} \u5931\u8D25\uFF1A${error.message}`,
      filePath
    );
  }
}
function stringifyYaml(value) {
  return (0, import_yaml.stringify)(value, { lineWidth: 0 });
}

// src/core/hook-router.ts
var allowedContextSources = /* @__PURE__ */ new Set([
  "instructions",
  "memories",
  "skills",
  "fix_patterns",
  "candidates",
  "recurring_errors"
]);
var allowedRiskLevels = /* @__PURE__ */ new Set(["low", "medium", "high", "blocked"]);
var allowedActivities = /* @__PURE__ */ new Set([
  "commit_advice",
  "audit_recorded",
  "observation_captured",
  "recurring_analyzed",
  "lifecycle_evaluated",
  "metrics_updated"
]);
function stringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
function validateHookRoutesConfig(value) {
  if (!value || typeof value !== "object") {
    throw new CliError("E_CONFIG_SCHEMA", "Hook Router \u914D\u7F6E\u5FC5\u987B\u662F\u5BF9\u8C61\u3002");
  }
  const config = value;
  const routes = config.routes;
  if (config.version !== 1 || !routes || typeof routes !== "object") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "Hook Router \u914D\u7F6E\u5FC5\u987B\u5305\u542B version=1 \u548C routes\u3002"
    );
  }
  const session = routes["session-start"];
  const prompt = routes["user-prompt-submit"];
  const stop = routes.stop;
  const tool2 = routes["pre-tool-use"];
  if (session?.handler !== "session_handshake") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "session-start \u5FC5\u987B\u8DEF\u7531\u5230 session_handshake\u3002"
    );
  }
  if (prompt?.handler !== "task_preflight") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "user-prompt-submit \u5FC5\u987B\u8DEF\u7531\u5230 task_preflight\u3002"
    );
  }
  if (stop?.handler !== "task_closure") {
    throw new CliError("E_CONFIG_SCHEMA", "stop \u5FC5\u987B\u8DEF\u7531\u5230 task_closure\u3002");
  }
  if (tool2 && tool2.handler !== "tool_policy") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "pre-tool-use \u5FC5\u987B\u8DEF\u7531\u5230 tool_policy\u3002"
    );
  }
  const contextSources = stringArray(prompt.context_sources);
  if (!contextSources.length || contextSources.some((source) => !allowedContextSources.has(source))) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "task_preflight.context_sources \u5305\u542B\u65E0\u6548\u6765\u6E90\u6216\u4E3A\u7A7A\u3002"
    );
  }
  const blockOnRisk = stringArray(prompt.block_on_risk);
  if (!blockOnRisk.length || blockOnRisk.some((level) => !allowedRiskLevels.has(level))) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "task_preflight.block_on_risk \u5305\u542B\u65E0\u6548\u98CE\u9669\u7B49\u7EA7\u6216\u4E3A\u7A7A\u3002"
    );
  }
  const requiredActivities = stringArray(stop.closure_steps);
  if (requiredActivities.length !== allowedActivities.size || requiredActivities.some(
    (activity) => !allowedActivities.has(activity)
  ) || new Set(requiredActivities).size !== requiredActivities.length) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "task_closure.closure_steps \u5FC5\u987B\u5B8C\u6574\u4E14\u4E0D\u80FD\u91CD\u590D\u3002"
    );
  }
  return {
    version: 1,
    routes: {
      "session-start": { handler: "session_handshake" },
      "user-prompt-submit": {
        handler: "task_preflight",
        context_sources: [...new Set(contextSources)],
        block_on_risk: [...new Set(blockOnRisk)]
      },
      "pre-tool-use": { handler: "tool_policy" },
      stop: {
        handler: "task_closure",
        closure_steps: [...new Set(requiredActivities)]
      }
    }
  };
}
async function loadHookRoutes(root) {
  const routePath = path7.join(root, ".repo-agent", "hooks", "routes.yaml");
  if (!await exists(routePath)) {
    throw new CliError(
      "E_PROJECT_NOT_INITIALIZED",
      "\u7F3A\u5C11 Hook Router \u914D\u7F6E\uFF0C\u8BF7\u8FD0\u884C `repo-agent init`\u3002",
      ".repo-agent/hooks/routes.yaml"
    );
  }
  try {
    return validateHookRoutesConfig(
      await readYaml(routePath)
    );
  } catch (error) {
    if (error instanceof CliError) throw error;
    throw new CliError(
      "E_CONFIG_PARSE",
      `\u65E0\u6CD5\u89E3\u6790 Hook Router \u914D\u7F6E\uFF1A${error.message}`,
      ".repo-agent/hooks/routes.yaml"
    );
  }
}

// src/core/tool-manifest.ts
var commonProperties = {
  sessionId: { type: "string" },
  turnId: { type: "string" },
  preflightId: { type: "string" },
  outcomeStatus: { enum: ["success", "failure", "partial"] },
  dryRun: { type: "boolean" }
};
function objectSchema(required = [], properties = {}) {
  return {
    type: "object",
    ...required.length ? { required } : {},
    properties: { ...commonProperties, ...properties },
    additionalProperties: false
  };
}
var nonEmptyString = { type: "string", minLength: 1 };
var stringArray2 = { type: "array", items: { type: "string" } };
function tool(definition) {
  const {
    readOnly = definition.sideEffect === "none",
    destructive = false,
    idempotent = definition.sideEffect === "none",
    ...value
  } = definition;
  return {
    ...value,
    annotations: {
      readOnlyHint: readOnly,
      destructiveHint: destructive,
      idempotentHint: idempotent,
      openWorldHint: false
    }
  };
}
var REPO_AGENT_TOOLS = [
  tool({
    name: "get_context_pack",
    description: "\u6839\u636E\u4EFB\u52A1\u751F\u6210\u9879\u76EE\u4E0A\u4E0B\u6587\u5305\u3001\u98CE\u9669\u548C\u5EFA\u8BAE\u3002",
    inputSchema: objectSchema(["task"], {
      task: nonEmptyString,
      executionEnvironment: { type: "object" }
    }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "get_latest_preflight",
    description: "\u6309\u5F53\u524D\u5DE5\u5177\u4F1A\u8BDD\u8BFB\u53D6\u6700\u8FD1\u4E00\u6B21 Hook preflight\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "get_closure_status",
    description: "\u8BFB\u53D6\u95ED\u73AF\u72B6\u6001\u3001\u5931\u8D25\u6B65\u9AA4\u548C Event Store \u5B8C\u6574\u6027\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "recover_closure",
    description: "\u5E42\u7B49\u6062\u590D\u5F53\u524D\u4F1A\u8BDD\u6700\u8FD1\u4E00\u6B21\u672A\u5B8C\u6210\u95ED\u73AF\u3002",
    inputSchema: objectSchema(),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "runtime",
    idempotent: true
  }),
  tool({
    name: "get_asset_evidence",
    description: "\u89E3\u91CA\u8D44\u4EA7 Evidence \u4E0E\u751F\u547D\u5468\u671F\u5065\u5EB7\u5206\u3002",
    inputSchema: objectSchema(["assetId"], { assetId: nonEmptyString }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "search_assets",
    description: "\u6309\u4EFB\u52A1\u68C0\u7D22\u53EF\u4FE1\u8D44\u4EA7\u548C\u4E0D\u53EF\u4FE1\u5EFA\u8BAE\u3002",
    inputSchema: objectSchema(["task"], { task: nonEmptyString }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "promote_candidate",
    description: "\u5C06\u8FBE\u5230\u6761\u4EF6\u7684\u79C1\u4EBA Candidate \u63D0\u8BAE\u4E3A\u56E2\u961F Candidate\u3002",
    inputSchema: objectSchema(["candidateId"], {
      candidateId: nonEmptyString,
      reviewer: { type: "string" }
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "team_candidate"
  }),
  tool({
    name: "get_health_metrics",
    description: "\u8BFB\u53D6\u6DF1\u5EA6\u5065\u5EB7\u6307\u6807\u548C\u95ED\u73AF\u7387\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "check_policy",
    description: "\u68C0\u67E5\u8DEF\u5F84\u3001\u547D\u4EE4\u6216\u5DE5\u5177\u662F\u5426\u7B26\u5408\u9879\u76EE\u7B56\u7565\u3002",
    inputSchema: objectSchema([], {
      paths: stringArray2,
      command: { type: "string" },
      toolId: { type: "string" }
    }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "recommend_tests",
    description: "\u6839\u636E\u9879\u76EE\u914D\u7F6E\u63A8\u8350\u6D4B\u8BD5\u547D\u4EE4\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "get_commit_options",
    description: "\u6839\u636E\u98CE\u9669\u548C\u63D0\u4EA4\u7B56\u7565\u8FD4\u56DE\u53EF\u9009\u63D0\u4EA4\u65B9\u5F0F\u3002",
    inputSchema: objectSchema([], {
      task: { type: "string" },
      paths: stringArray2
    }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "runtime",
    readOnly: false,
    idempotent: true
  }),
  tool({
    name: "propose_memory",
    description: "\u521B\u5EFA memory \u5019\u9009\uFF0C\u4E0D\u76F4\u63A5\u4FEE\u6539\u5DF2\u6279\u51C6\u8D44\u4EA7\u3002",
    inputSchema: objectSchema(["id", "content"], {
      id: nonEmptyString,
      content: nonEmptyString,
      task: { type: "string" },
      scope: stringArray2
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate"
  }),
  tool({
    name: "propose_skill",
    description: "\u521B\u5EFA skill \u5019\u9009\uFF0C\u4E0D\u76F4\u63A5\u4FEE\u6539\u5DF2\u6279\u51C6\u8D44\u4EA7\u3002",
    inputSchema: objectSchema(["id", "description"], {
      id: nonEmptyString,
      description: nonEmptyString,
      task: { type: "string" },
      scope: stringArray2
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate"
  }),
  tool({
    name: "propose_fix_pattern",
    description: "\u521B\u5EFA fix pattern \u5019\u9009\uFF0C\u4E0D\u76F4\u63A5\u4FEE\u6539\u5DF2\u6279\u51C6\u8D44\u4EA7\u3002",
    inputSchema: objectSchema(["id", "pattern"], {
      id: nonEmptyString,
      pattern: nonEmptyString,
      task: { type: "string" },
      scope: stringArray2
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate"
  }),
  tool({
    name: "classify_learning",
    description: "\u5224\u65AD\u5B66\u4E60\u7ED3\u679C\u5E94\u6C89\u6DC0\u4E3A\u54EA\u7C7B\u5019\u9009\u3002",
    inputSchema: objectSchema(["task", "observation"], {
      task: nonEmptyString,
      observation: nonEmptyString
    }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "record_trace",
    description: "\u8BB0\u5F55\u7ECF\u8FC7\u8131\u654F\u7684\u672C\u5730\u4EFB\u52A1\u5BA1\u8BA1\u3002",
    inputSchema: objectSchema(["task"], {
      task: nonEmptyString,
      outcome: { type: "string" },
      usedMemories: stringArray2,
      usedSkills: stringArray2,
      usedFixPatterns: stringArray2,
      commitOptions: { type: "object" }
    }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "runtime"
  }),
  tool({
    name: "list_skills",
    description: "\u5217\u51FA\u5DF2\u6279\u51C6\u7684 skill\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "list_fix_patterns",
    description: "\u5217\u51FA\u5DF2\u6279\u51C6\u7684 fix pattern\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "list_recurring_errors",
    description: "\u5217\u51FA\u5DF2\u8BC6\u522B\u7684\u91CD\u590D\u9519\u8BEF\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "analyze_recurring_errors",
    description: "\u91CD\u65B0\u5206\u6790\u5BA1\u8BA1\u548C Learning Inbox \u4E2D\u7684\u91CD\u590D\u9519\u8BEF\u3002",
    inputSchema: objectSchema(),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate",
    idempotent: true
  }),
  tool({
    name: "recommend_for_recurring_errors",
    description: "\u9488\u5BF9\u5F53\u524D\u4EFB\u52A1\u63A8\u8350\u76F8\u5173\u91CD\u590D\u9519\u8BEF\u5904\u7406\u65B9\u6CD5\u3002",
    inputSchema: objectSchema(["task"], { task: nonEmptyString }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "propose_fix_pattern_from_recurring_error",
    description: "\u6839\u636E\u91CD\u590D\u9519\u8BEF\u751F\u6210 fix pattern \u5019\u9009\u3002",
    inputSchema: objectSchema(["id"], { id: nonEmptyString }),
    approvalMode: "prompt",
    risk: "medium",
    sideEffect: "candidate"
  }),
  tool({
    name: "detect_duplicates",
    description: "\u68C0\u6D4B\u91CD\u590D\u5019\u9009\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "redact_secrets",
    description: "\u5BF9\u6587\u672C\u4E2D\u7684\u7591\u4F3C\u654F\u611F\u4FE1\u606F\u8FDB\u884C\u8131\u654F\u3002",
    inputSchema: objectSchema(["input"], { input: nonEmptyString }),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "resolve_conflicts",
    description: "\u68C0\u6D4B\u4E2A\u4EBA\u914D\u7F6E\u548C\u5019\u9009\u8D44\u4EA7\u51B2\u7A81\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  }),
  tool({
    name: "generate_patch_summary",
    description: "\u751F\u6210\u5F53\u524D Git \u53D8\u66F4\u6458\u8981\uFF0C\u4E0D\u5199\u5165\u8865\u4E01\u3002",
    inputSchema: objectSchema(),
    approvalMode: "approve",
    risk: "low",
    sideEffect: "none"
  })
];
var toolByName = new Map(
  REPO_AGENT_TOOLS.map((item) => [item.name, item])
);
function getRepoAgentTool(name) {
  return toolByName.get(name);
}
function getRepoAgentToolByHookId(toolId) {
  const prefix = "mcp__repo_agent__";
  return toolId.startsWith(prefix) ? getRepoAgentTool(toolId.slice(prefix.length)) : void 0;
}
function isRepoAgentHookToolId(toolId) {
  return toolId.startsWith("mcp__repo_agent__");
}

// src/core/opencode-plugin.ts
var OPENCODE_PLUGIN_PATH = ".opencode/plugins/repo-agent.js";
function opencodePluginSource() {
  return `// Generated by repo-agent ${VERSION}. Do not edit manually.
const VERSION = ${JSON.stringify(VERSION)}
const TIMEOUT_MS = 15_000

async function runHook(directory, event, input) {
  const bundle = \`\${directory}/repo-agent/repo-agent.bundle.js\`
  const child = Bun.spawn(
    ["node", bundle, "hook", event, "--tool", "opencode"],
    {
      cwd: directory,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    },
  )
  child.stdin.write(JSON.stringify(input))
  child.stdin.end()
  const timer = setTimeout(() => child.kill(), TIMEOUT_MS)
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]).finally(() => clearTimeout(timer))
  if (exitCode !== 0) {
    throw new Error(stderr.trim() || \`repo-agent hook exited with \${exitCode}\`)
  }
  const text = stdout.trim()
  if (!text) throw new Error("repo-agent hook returned no output")
  return JSON.parse(text)
}

function textFromParts(parts) {
  return parts
    .filter((part) => part?.type === "text" && part.synthetic !== true)
    .map((part) => part.text)
    .filter(Boolean)
    .join("\\n")
    .trim()
}

function randomId() {
  const randomUUID = globalThis.crypto?.randomUUID
  if (typeof randomUUID === "function") {
    return randomUUID.call(globalThis.crypto)
  }
  return \`\${Date.now()}-\${Math.random().toString(16).slice(2)}\`
}

async function lastAssistantMessage(client, sessionID) {
  try {
    const response = await client.session.messages({ path: { id: sessionID } })
    const messages = response?.data ?? response ?? []
    const assistant = [...messages]
      .reverse()
      .find((item) => item?.info?.role === "assistant")
    return assistant ? textFromParts(assistant.parts ?? []) : null
  } catch {
    return null
  }
}

export const RepoAgentPlugin = async ({ client, directory }) => {
  const logFailure = async (event, error) => {
    await client.app.log({
      body: {
        service: "repo-agent",
        level: "error",
        message: \`\${event}: \${error instanceof Error ? error.message : String(error)}\`,
        extra: { version: VERSION },
      },
    })
  }

  return {
    event: async ({ event }) => {
      try {
        if (event.type === "session.created") {
          await runHook(directory, "session-start", {
            session_id: event.properties.info.id,
            cwd: directory,
            hook_event_name: "SessionStart",
          })
        }
        if (event.type === "session.idle") {
          const sessionID = event.properties.sessionID
          await runHook(directory, "stop", {
            session_id: sessionID,
            cwd: directory,
            hook_event_name: "Stop",
            stop_hook_active: true,
            last_assistant_message: await lastAssistantMessage(client, sessionID),
            outcome_status: "partial",
          })
        }
      } catch (error) {
        await logFailure(event.type, error)
      }
    },

    "chat.message": async (input, output) => {
      const task = textFromParts(output.parts)
      const result = await runHook(directory, "user-prompt-submit", {
        session_id: input.sessionID,
        turn_id: output.message.id,
        cwd: directory,
        prompt: task,
        hook_event_name: "UserPromptSubmit",
      })
      if (result.decision === "block") {
        throw new Error(result.reason || "repo-agent blocked this prompt")
      }
      const additionalContext = result?.hookSpecificOutput?.additionalContext
      if (typeof additionalContext === "string" && additionalContext) {
        output.parts.push({
          id: \`repo-agent-\${randomId()}\`,
          sessionID: input.sessionID,
          messageID: output.message.id,
          type: "text",
          text: \`\\n\\n\${additionalContext}\`,
          synthetic: true,
        })
      }
    },

    "tool.execute.before": async (input, output) => {
      const result = await runHook(directory, "pre-tool-use", {
        session_id: input.sessionID,
        cwd: directory,
        tool_name: input.tool,
        tool_input: output.args ?? {},
        hook_event_name: "PreToolUse",
      })
      if (result.decision === "block") {
        throw new Error(result.reason || "repo-agent blocked this tool call")
      }
    },
  }
}
`;
}

// src/core/integration-manager.ts
var start = "# >>> repo-agent integration managed";
var end = "# <<< repo-agent integration managed";
var skillMarker = "<!-- repo-agent managed skill v1 -->";
var commandMarker = "<!-- repo-agent managed command v1 -->";
var managedSkillFiles = [
  "SKILL.md",
  "agents/openai.yaml",
  "scripts/install.mjs",
  "references/command-map.md"
];
var hookCommand = (tool2, event) => tool2 === "codex" ? `node "$(git rev-parse --show-toplevel)/repo-agent/repo-agent.bundle.js" hook ${event} --tool ${tool2}` : `node repo-agent/repo-agent.bundle.js hook ${event} --tool ${tool2}`;
var hookCommandWindows = (tool2, event) => `powershell.exe -NoProfile -Command "$r=(git rev-parse --show-toplevel); & node (Join-Path $r 'repo-agent/repo-agent.bundle.js') hook ${event} --tool ${tool2}"`;
async function updateManagedText(filePath, block, dryRun) {
  const previous = await exists(filePath) ? await readFile4(filePath, "utf8") : "";
  const expression = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "g");
  const base = previous.replace(expression, "").trimEnd();
  const next = block ? `${base ? `${base}

` : ""}${block}
` : base ? `${base}
` : "";
  if (next === previous) return "skipped";
  if (!dryRun) {
    await mkdir2(path8.dirname(filePath), { recursive: true });
    await writeFile3(filePath, next, "utf8");
  }
  return previous ? "updated" : "created";
}
async function updateJsonc(filePath, changes, dryRun) {
  const fileExists = await exists(filePath);
  if (!fileExists && changes.every((change) => change.value === void 0)) {
    return "skipped";
  }
  let content = fileExists ? await readFile4(filePath, "utf8") : "{}\n";
  const errors = [];
  parse2(content, errors);
  if (errors.length) throw new CliError("E_CONFIG_PARSE", `\u65E0\u6CD5\u5B89\u5168\u5408\u5E76 ${path8.basename(filePath)}\u3002`, filePath);
  const previous = content;
  for (const change of changes) {
    content = applyEdits(content, modify(content, change.path, change.value, {
      formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" }
    }));
  }
  if (!content.endsWith("\n")) content += "\n";
  if (content === previous) return "skipped";
  if (!dryRun) {
    await mkdir2(path8.dirname(filePath), { recursive: true });
    await writeFile3(filePath, content, "utf8");
  }
  return fileExists ? "updated" : "created";
}
async function updateOwnedFile(filePath, content, dryRun) {
  const fileExists = await exists(filePath);
  if (content === null) {
    if (!fileExists) return "skipped";
    if (!dryRun) await rm(filePath, { force: true });
    return "updated";
  }
  const previous = fileExists ? await readFile4(filePath, "utf8") : null;
  if (previous === content) return "skipped";
  if (!dryRun) {
    await mkdir2(path8.dirname(filePath), { recursive: true });
    await writeFile3(filePath, content, "utf8");
  }
  return fileExists ? "updated" : "created";
}
async function packagedSkillRoot() {
  const executable = process.argv[1];
  if (!executable) return null;
  const directory = path8.dirname(path8.resolve(executable));
  const skill = path8.join(directory, "SKILL.md");
  if (!await exists(skill)) return null;
  const content = await readFile4(skill, "utf8");
  return content.includes(skillMarker) ? directory : null;
}
async function removeEmpty(directory) {
  try {
    await rmdir(directory);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTEMPTY") throw error;
  }
}
async function syncManagedSkill(sourceRoot, destinationRoot, remove, dryRun) {
  if (!remove && !sourceRoot) return "skipped";
  const destinationSkill = path8.join(destinationRoot, "SKILL.md");
  const destinationExists = await exists(destinationSkill);
  if (destinationExists) {
    const current = await readFile4(destinationSkill, "utf8");
    if (!current.includes(skillMarker)) {
      throw new CliError(
        "E_INTEGRATION_CONFLICT",
        `\u76EE\u6807 Skill \u4E0D\u662F repo-agent \u6258\u7BA1\u6587\u4EF6\uFF0C\u5DF2\u505C\u6B62\u4FEE\u6539\uFF1A${destinationSkill}`,
        destinationSkill
      );
    }
  } else {
    const remainingFiles = (await Promise.all(
      managedSkillFiles.filter((relative) => relative !== "SKILL.md").map(async (relative) => ({
        relative,
        exists: await exists(path8.join(destinationRoot, relative))
      }))
    )).filter((item) => item.exists);
    const matchesSource = sourceRoot && remainingFiles.length ? (await Promise.all(remainingFiles.map(
      async ({ relative }) => await readFile4(path8.join(destinationRoot, relative), "utf8") === await readFile4(path8.join(sourceRoot, relative), "utf8")
    ))).every(Boolean) : false;
    if (remainingFiles.length && !matchesSource) {
      throw new CliError(
        "E_INTEGRATION_CONFLICT",
        `\u76EE\u6807 Skill \u76EE\u5F55\u5B58\u5728\u975E\u6258\u7BA1\u5185\u5BB9\uFF0C\u5DF2\u505C\u6B62\u4FEE\u6539\uFF1A${destinationRoot}`,
        destinationRoot
      );
    }
  }
  if (remove) {
    if (!destinationExists) return "skipped";
    if (!dryRun) {
      for (const relative of managedSkillFiles) {
        await rm(path8.join(destinationRoot, relative), { force: true });
      }
      await removeEmpty(path8.join(destinationRoot, "agents"));
      await removeEmpty(path8.join(destinationRoot, "scripts"));
      await removeEmpty(path8.join(destinationRoot, "references"));
      await removeEmpty(destinationRoot);
    }
    return "updated";
  }
  if (!sourceRoot) return "skipped";
  let changed = !destinationExists;
  const contents = /* @__PURE__ */ new Map();
  for (const relative of managedSkillFiles) {
    const source = path8.join(sourceRoot, relative);
    if (!await exists(source)) {
      throw new CliError(
        "E_CONFIG_SCHEMA",
        `\u79BB\u7EBF\u5305 Skill \u7F3A\u5C11\u6587\u4EF6\uFF1A${relative}`,
        source
      );
    }
    const incoming = await readFile4(source, "utf8");
    contents.set(relative, incoming);
    const destination = path8.join(destinationRoot, relative);
    const previous = await exists(destination) ? await readFile4(destination, "utf8") : null;
    if (previous !== incoming) changed = true;
  }
  if (!changed) return "skipped";
  if (!dryRun) {
    for (const [relative, content] of contents) {
      const destination = path8.join(destinationRoot, relative);
      await mkdir2(path8.dirname(destination), { recursive: true });
      await writeFile3(destination, content, "utf8");
    }
  }
  return destinationExists ? "updated" : "created";
}
function openCodeCommandSource() {
  return `---
description: \u6253\u5F00 repo-agent \u4EA4\u4E92\u5F0F\u63A7\u5236\u4E2D\u5FC3
---

${commandMarker}

\u4F7F\u7528 skill \u5DE5\u5177\u52A0\u8F7D\u540D\u4E3A repo-agent \u7684\u9879\u76EE Skill\uFF0C\u5E76\u4E25\u683C\u6309\u7167\u8BE5 Skill \u7684\u6D41\u7A0B\u5904\u7406\u4EE5\u4E0B\u7528\u6237\u610F\u56FE\uFF1A

$ARGUMENTS

\u5982\u679C\u6CA1\u6709\u53C2\u6570\uFF0C\u663E\u793A repo-agent \u7528\u6237\u64CD\u4F5C\u83DC\u5355\u3002\u4E0D\u8981\u63D0\u4F9B\u6784\u5EFA\u3001\u6253\u5305\u6216\u53D1\u5E03\u547D\u4EE4\u3002
`;
}
async function updateManagedCommand(filePath, content, dryRun) {
  const fileExists = await exists(filePath);
  if (fileExists) {
    const previous = await readFile4(filePath, "utf8");
    if (!previous.includes(commandMarker)) {
      throw new CliError(
        "E_INTEGRATION_CONFLICT",
        `\u76EE\u6807\u547D\u4EE4\u4E0D\u662F repo-agent \u6258\u7BA1\u6587\u4EF6\uFF0C\u5DF2\u505C\u6B62\u4FEE\u6539\uFF1A${filePath}`,
        filePath
      );
    }
    if (content === previous) return "skipped";
  } else if (content === null) {
    return "skipped";
  }
  if (!dryRun) {
    if (content === null) await rm(filePath, { force: true });
    else {
      await mkdir2(path8.dirname(filePath), { recursive: true });
      await writeFile3(filePath, content, "utf8");
    }
  }
  return fileExists ? "updated" : "created";
}
var openCodePromptTools = REPO_AGENT_TOOLS.filter((tool2) => tool2.approvalMode === "prompt").map((tool2) => `repo-agent_${tool2.name}`);
async function updateOpenCodeConfig(filePath, remove, dryRun) {
  const fileExists = await exists(filePath);
  const content = fileExists ? await readFile4(filePath, "utf8") : "{}\n";
  const errors = [];
  const document = parse2(content, errors);
  if (errors.length) {
    throw new CliError("E_CONFIG_PARSE", "\u65E0\u6CD5\u5B89\u5168\u5408\u5E76 opencode.json\u3002", filePath);
  }
  let permissionChange = document?.permission;
  if (typeof permissionChange === "string") {
    if (permissionChange === "allow" && !remove) {
      throw new CliError(
        "E_CONFIG_PARSE",
        "opencode.json \u7684 permission \u4E3A\u5168\u5C40 allow\uFF0C\u65E0\u6CD5\u5B89\u5168\u8FFD\u52A0 repo-agent \u5199\u5DE5\u5177\u5BA1\u6279\uFF1B\u8BF7\u6539\u4E3A\u5BF9\u8C61\u5F62\u5F0F\u3002",
        filePath
      );
    }
  } else {
    const permissions = {
      ...permissionChange ?? {}
    };
    for (const tool2 of openCodePromptTools) {
      if (remove) {
        if (permissions[tool2] === "ask") delete permissions[tool2];
      } else if (permissions[tool2] !== "deny") {
        permissions[tool2] = "ask";
      }
    }
    permissionChange = Object.keys(permissions).length ? permissions : void 0;
  }
  return updateJsonc(filePath, [
    {
      path: ["mcp", "repo-agent"],
      value: remove ? void 0 : {
        type: "local",
        command: ["node", "repo-agent/repo-agent.bundle.js", "mcp", "stdio"],
        enabled: true,
        environment: { REPO_AGENT_INTEGRATION_VERSION: VERSION }
      }
    },
    { path: ["permission"], value: permissionChange }
  ], dryRun);
}
function codexToml() {
  const approvedTools = REPO_AGENT_TOOLS.filter((tool2) => tool2.approvalMode === "approve").map(
    (tool2) => `[mcp_servers.repo_agent.tools.${tool2.name}]
approval_mode = "approve"`
  ).join("\n\n");
  return `${start}
# version = ${VERSION}
[mcp_servers.repo_agent]
command = "node"
args = ["repo-agent/repo-agent.bundle.js", "mcp", "stdio"]
enabled = true
required = false
default_tools_approval_mode = "prompt"

${approvedTools}
${end}`;
}
function hookGroups(tool2, event) {
  const command = hookCommand(tool2, event);
  const handler = tool2 === "claude-code" ? {
    type: "command",
    command: "node",
    args: [
      "${CLAUDE_PROJECT_DIR}/repo-agent/repo-agent.bundle.js",
      "hook",
      event,
      "--tool",
      tool2
    ],
    timeout: 15,
    statusMessage: "\u6B63\u5728\u68C0\u67E5 repo-agent \u914D\u7F6E"
  } : {
    type: "command",
    command,
    commandWindows: hookCommandWindows(tool2, event),
    timeout: 15,
    statusMessage: "\u6B63\u5728\u68C0\u67E5 repo-agent \u914D\u7F6E"
  };
  return [
    {
      hooks: [handler]
    }
  ];
}
function isRepoAgentHook(value) {
  const serialized = JSON.stringify(value);
  return serialized.includes("repo-agent.bundle.js") && (serialized.includes("handshake") || serialized.includes('"hook"') || serialized.includes(" hook "));
}
async function updateHooks(filePath, tool2, remove, dryRun) {
  const fileExists = await exists(filePath);
  if (remove && !fileExists) return "skipped";
  const content = fileExists ? await readFile4(filePath, "utf8") : "{}\n";
  const errors = [];
  const document = parse2(content, errors);
  if (errors.length) {
    throw new CliError("E_CONFIG_PARSE", `\u65E0\u6CD5\u5B89\u5168\u5408\u5E76 ${path8.basename(filePath)}\u3002`, filePath);
  }
  const changes = [];
  for (const event of ["SessionStart", "UserPromptSubmit", "PreToolUse", "Stop"]) {
    const existing = document?.hooks?.[event];
    if (existing !== void 0 && !Array.isArray(existing)) {
      throw new CliError(
        "E_CONFIG_PARSE",
        `${path8.basename(filePath)} \u4E2D hooks.${event} \u4E0D\u662F\u6570\u7EC4\uFF0C\u5DF2\u505C\u6B62\u4FEE\u6539\u4EE5\u4FDD\u62A4\u73B0\u6709\u914D\u7F6E\u3002`,
        filePath
      );
    }
    const preserved = (existing ?? []).filter((group) => !isRepoAgentHook(group));
    const value = remove ? preserved.length ? preserved : void 0 : [...preserved, ...hookGroups(
      tool2,
      event === "SessionStart" ? "session-start" : event === "UserPromptSubmit" ? "user-prompt-submit" : event === "PreToolUse" ? "pre-tool-use" : "stop"
    )];
    changes.push({ path: ["hooks", event], value });
  }
  return updateJsonc(filePath, changes, dryRun);
}
function resolveEntryMode(tool2, entry) {
  const capability = getToolAdapter(tool2).capabilities;
  const resolved = entry === "auto" ? capability.defaultEntry : entry;
  if (resolved === "hook" && !capability.supportsHooks) {
    throw new CliError("E_UNSUPPORTED_ENTRY", `${tool2} \u4E0D\u652F\u6301 hook entry\u3002`);
  }
  if (resolved === "plugin" && !capability.supportsPlugin) {
    throw new CliError("E_UNSUPPORTED_ENTRY", `${tool2} \u4E0D\u652F\u6301 plugin entry\u3002`);
  }
  if (resolved === "mcp-only" && !capability.supportsMcp) {
    throw new CliError("E_UNSUPPORTED_ENTRY", `${tool2} \u4E0D\u652F\u6301 mcp-only entry\u3002`);
  }
  return resolved;
}
async function validateIntegrationSelection(root, selected, entry) {
  const adapters = await selectToolAdapters(root, selected);
  for (const adapter of adapters) resolveEntryMode(adapter.id, entry);
}
async function activateIntegrations(root, selected, dryRun = false, entry = "auto") {
  const adapters = await selectToolAdapters(root, selected);
  const selectedTools = adapters.map((adapter) => adapter.id);
  const resolvedEntries = new Map(
    selectedTools.map((tool2) => [tool2, resolveEntryMode(tool2, entry)])
  );
  const actions = [];
  const entryFor = (tool2) => resolvedEntries.get(tool2) ?? resolveEntryMode(tool2, entry);
  const skillSource = await packagedSkillRoot();
  if (selectedTools.includes("claude-code")) {
    await syncManagedSkill(
      skillSource,
      path8.join(root, ".claude", "skills", "repo-agent"),
      entryFor("claude-code") === "none",
      true
    );
  }
  if (selectedTools.includes("codex")) {
    await syncManagedSkill(
      skillSource,
      path8.join(root, ".agents", "skills", "repo-agent"),
      entryFor("codex") === "none",
      true
    );
  }
  if (selectedTools.includes("opencode")) {
    const remove = entryFor("opencode") === "none";
    await syncManagedSkill(
      skillSource,
      path8.join(root, ".opencode", "skills", "repo-agent"),
      remove,
      true
    );
    if (remove || skillSource) {
      await updateManagedCommand(
        path8.join(root, ".opencode", "commands", "repo-agent.md"),
        remove ? null : openCodeCommandSource(),
        true
      );
    }
  }
  if (selectedTools.includes("claude-code")) {
    const mode = entryFor("claude-code");
    actions.push([".mcp.json", () => updateJsonc(path8.join(root, ".mcp.json"), [{
      path: ["mcpServers", "repo-agent"],
      value: mode === "none" ? void 0 : {
        command: "node",
        args: ["repo-agent/repo-agent.bundle.js", "mcp", "stdio"],
        env: { REPO_AGENT_INTEGRATION_VERSION: VERSION }
      }
    }], dryRun)]);
    actions.push([".claude/settings.json", () => updateHooks(
      path8.join(root, ".claude", "settings.json"),
      "claude-code",
      mode !== "hook",
      dryRun
    )]);
    actions.push([".claude/skills/repo-agent", () => syncManagedSkill(
      skillSource,
      path8.join(root, ".claude", "skills", "repo-agent"),
      mode === "none",
      dryRun
    )]);
  }
  if (selectedTools.includes("codex")) {
    const mode = entryFor("codex");
    actions.push([".codex/config.toml", () => updateManagedText(
      path8.join(root, ".codex", "config.toml"),
      mode === "none" ? "" : codexToml(),
      dryRun
    )]);
    actions.push([".codex/hooks.json", () => updateHooks(
      path8.join(root, ".codex", "hooks.json"),
      "codex",
      mode !== "hook",
      dryRun
    )]);
    actions.push([".agents/skills/repo-agent", () => syncManagedSkill(
      skillSource,
      path8.join(root, ".agents", "skills", "repo-agent"),
      mode === "none",
      dryRun
    )]);
  }
  if (selectedTools.includes("opencode")) {
    const mode = entryFor("opencode");
    actions.push(["opencode.json", () => updateOpenCodeConfig(
      path8.join(root, "opencode.json"),
      mode === "none",
      dryRun
    )]);
    actions.push([OPENCODE_PLUGIN_PATH, () => updateOwnedFile(
      path8.join(root, OPENCODE_PLUGIN_PATH),
      mode === "plugin" ? opencodePluginSource() : null,
      dryRun
    )]);
    actions.push([".opencode/skills/repo-agent", () => syncManagedSkill(
      skillSource,
      path8.join(root, ".opencode", "skills", "repo-agent"),
      mode === "none",
      dryRun
    )]);
    if (mode === "none" || skillSource) {
      actions.push([".opencode/commands/repo-agent.md", () => updateManagedCommand(
        path8.join(root, ".opencode", "commands", "repo-agent.md"),
        mode === "none" ? null : openCodeCommandSource(),
        dryRun
      )]);
    }
  }
  const created = [];
  const updated = [];
  const skipped = [];
  for (const [relativePath, apply] of actions) {
    const result = await apply();
    (result === "created" ? created : result === "updated" ? updated : skipped).push(relativePath);
  }
  if (!dryRun) {
    const statePath = path8.join(root, ".repo-agent-runtime", "activation.json");
    await mkdir2(path8.dirname(statePath), { recursive: true });
    await writeFile3(statePath, `${JSON.stringify({
      version: 1,
      configuredVersion: VERSION,
      tools: selectedTools,
      entries: Object.fromEntries(selectedTools.map((tool2) => [tool2, entryFor(tool2)])),
      state: "pending_reload",
      reloadType: "new_session",
      configuredAt: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2)}
`);
  }
  return {
    ok: true,
    command: "activate",
    tool: selected,
    entry,
    configured: selectedTools.some((tool2) => entryFor(tool2) !== "none"),
    effective: false,
    state: "pending_reload",
    reloadRequired: true,
    reloadType: "new_session",
    created,
    updated,
    skipped,
    message: selectedTools.length ? "\u914D\u7F6E\u5DF2\u5B8C\u6210\uFF1B\u8BF7\u4FE1\u4EFB\u9879\u76EE\u914D\u7F6E\u548C hooks\uFF0C\u5E76\u65B0\u5EFA\u4F1A\u8BDD\u3002" : "\u672A\u68C0\u6D4B\u5230\u5DF2\u6709\u5DE5\u5177\u914D\u7F6E\uFF1B\u53EF\u4F7F\u7528 --tool all \u6216\u6307\u5B9A\u5DE5\u5177\u8FDB\u884C\u63A5\u5165\u3002"
  };
}
async function filesContain(checks) {
  for (const check of checks) {
    if (!await exists(check.file)) return false;
    const content = await readFile4(check.file, "utf8");
    if (!check.values.every((value) => content.includes(value))) return false;
  }
  return true;
}
async function openCodePermissionsCurrent(file) {
  if (!await exists(file)) return false;
  const errors = [];
  const document = parse2(await readFile4(file, "utf8"), errors);
  if (errors.length) return false;
  if (document?.permission === "ask" || document?.permission === "deny") {
    return true;
  }
  if (!document?.permission || typeof document.permission !== "object") {
    return false;
  }
  const permissions = document.permission;
  return openCodePromptTools.every(
    (toolName) => permissions[toolName] === "ask" || permissions[toolName] === "deny"
  );
}
async function configIsCurrent(root, tool2, entry) {
  if (entry === "none") return false;
  const requiresHook = entry === "hook";
  if (tool2 === "codex") {
    if (!requiresHook && await hasRepoAgentHooks(path8.join(root, ".codex", "hooks.json"))) return false;
    if (requiresHook && !await hooksAreCurrent(path8.join(root, ".codex", "hooks.json"))) return false;
    return filesContain([{
      file: path8.join(root, ".codex", "config.toml"),
      values: [
        "mcp_servers.repo_agent",
        `version = ${VERSION}`,
        'default_tools_approval_mode = "prompt"',
        ...REPO_AGENT_TOOLS.filter((item) => item.approvalMode === "approve").map((item) => `[mcp_servers.repo_agent.tools.${item.name}]`)
      ]
    }]);
  }
  if (tool2 === "claude-code") {
    if (!requiresHook && await hasRepoAgentHooks(path8.join(root, ".claude", "settings.json"))) return false;
    if (requiresHook && !await hooksAreCurrent(path8.join(root, ".claude", "settings.json"))) return false;
    return filesContain([{
      file: path8.join(root, ".mcp.json"),
      values: ["repo-agent", `"REPO_AGENT_INTEGRATION_VERSION": "${VERSION}"`]
    }]);
  }
  if (tool2 === "opencode") {
    const baseCurrent = await filesContain([{
      file: path8.join(root, "opencode.json"),
      values: [
        "repo-agent",
        `"REPO_AGENT_INTEGRATION_VERSION": "${VERSION}"`
      ]
    }]);
    if (!baseCurrent || !await openCodePermissionsCurrent(path8.join(root, "opencode.json"))) return false;
    if (entry !== "plugin") return true;
    return filesContain([{
      file: path8.join(root, OPENCODE_PLUGIN_PATH),
      values: [`Generated by repo-agent ${VERSION}`, '"chat.message"', '"tool.execute.before"']
    }]);
  }
  return false;
}
async function hasRepoAgentHooks(file) {
  if (!await exists(file)) return false;
  const errors = [];
  const document = parse2(await readFile4(file, "utf8"), errors);
  if (errors.length || !document?.hooks) return false;
  return Object.values(document.hooks).some(
    (groups) => Array.isArray(groups) && groups.some(isRepoAgentHook)
  );
}
async function hooksAreCurrent(file) {
  if (!await exists(file)) return false;
  const errors = [];
  const document = parse2(await readFile4(file, "utf8"), errors);
  if (errors.length || !document?.hooks) return false;
  const expected = /* @__PURE__ */ new Map([
    ["SessionStart", "session-start"],
    ["UserPromptSubmit", "user-prompt-submit"],
    ["PreToolUse", "pre-tool-use"],
    ["Stop", "stop"]
  ]);
  return [...expected].every(([event, commandEvent]) => {
    const groups = document.hooks?.[event];
    return Array.isArray(groups) && groups.some((group) => {
      const serialized = JSON.stringify(group);
      return isRepoAgentHook(group) && serialized.includes(commandEvent);
    });
  });
}
async function configStatus(root, tool2, entry) {
  if (await configIsCurrent(root, tool2, entry)) return "current";
  const primaryFile = tool2 === "codex" ? path8.join(root, ".codex", "config.toml") : tool2 === "claude-code" ? path8.join(root, ".mcp.json") : path8.join(root, "opencode.json");
  if (!await exists(primaryFile)) return "missing";
  return (await readFile4(primaryFile, "utf8")).includes("repo-agent") ? "stale" : "missing";
}
async function handshake(options) {
  if (options.hook !== void 0 && options.hook !== "session-start") {
    throw new CliError("E_HOOK_INPUT", "\u65E0\u6548\u7684\u5185\u90E8 Hook \u6FC0\u6D3B\u6765\u6E90\u3002");
  }
  const selectedTools = (await selectToolAdapters(options.root, options.tool)).map((adapter) => adapter.id);
  const projectInitialized = await exists(
    path8.join(options.root, ".repo-agent", "config.yaml")
  );
  let hookRouterReady = false;
  if (projectInitialized) {
    try {
      await loadHookRoutes(options.root);
      hookRouterReady = true;
    } catch {
      hookRouterReady = false;
    }
  }
  const statePath = path8.join(options.root, ".repo-agent-runtime", "activation.json");
  const state = await exists(statePath) ? JSON.parse(await readFile4(statePath, "utf8")) : {};
  const checks = [];
  const entries = state.entries && typeof state.entries === "object" ? state.entries : {};
  for (const tool2 of selectedTools) {
    const entry = entries[tool2] ?? getToolAdapter(tool2).capabilities.defaultEntry;
    const integrationStatus = await configStatus(options.root, tool2, entry);
    const configured = integrationStatus !== "missing";
    const versionCurrent = integrationStatus === "current" && (state.configuredVersion === void 0 || state.configuredVersion === VERSION);
    checks.push({
      tool: tool2,
      entry,
      configured,
      configStatus: integrationStatus,
      configuredVersion: state.configuredVersion ?? null,
      requiredVersion: VERSION,
      status: !projectInitialized || integrationStatus === "missing" ? "not_activated" : !hookRouterReady ? "repair_required" : !versionCurrent ? "repair_required" : options.hook ? "active" : state.state ?? "pending_reload"
    });
  }
  if (options.hook && projectInitialized && hookRouterReady && checks.length > 0 && checks.every((check) => check.configStatus === "current")) {
    await mkdir2(path8.dirname(statePath), { recursive: true });
    await writeFile3(statePath, `${JSON.stringify({
      ...state,
      configuredVersion: VERSION,
      tools: selectedTools,
      state: "active",
      reloadType: "none",
      activatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastHook: options.hook
    }, null, 2)}
`);
  }
  const status = !projectInitialized || checks.length === 0 ? "not_activated" : checks.some((check) => check.status === "not_activated") ? "not_activated" : checks.some((check) => check.status === "repair_required") ? "repair_required" : checks.some((check) => check.status === "pending_reload") ? "pending_reload" : "active";
  return {
    ok: true,
    command: "handshake",
    status,
    tool: options.tool,
    projectInitialized,
    hookRouterReady,
    checks,
    reloadRequired: status === "pending_reload",
    reloadType: status === "pending_reload" ? "new_session" : "none",
    suggestedCommand: !projectInitialized ? "node repo-agent/repo-agent.bundle.js init --mode team" : !hookRouterReady ? "node repo-agent/repo-agent.bundle.js validate --strict" : status === "not_activated" || status === "repair_required" ? `node repo-agent/repo-agent.bundle.js activate --repair --tool ${options.tool}` : null,
    warnings: [
      ...!projectInitialized ? ["\u9879\u76EE\u5C1A\u672A\u521D\u59CB\u5316\u3002"] : [],
      ...projectInitialized && !hookRouterReady ? ["Hook Router \u914D\u7F6E\u7F3A\u5931\u6216\u65E0\u6548\u3002"] : []
    ]
  };
}
async function deactivateIntegrations(root, selected, dryRun = false) {
  const selectedTools = (await selectToolAdapters(root, selected)).map((adapter) => adapter.id);
  const changed = [];
  if (selectedTools.includes("codex")) {
    await syncManagedSkill(
      null,
      path8.join(root, ".agents", "skills", "repo-agent"),
      true,
      true
    );
  }
  if (selectedTools.includes("claude-code")) {
    await syncManagedSkill(
      null,
      path8.join(root, ".claude", "skills", "repo-agent"),
      true,
      true
    );
  }
  if (selectedTools.includes("opencode")) {
    await syncManagedSkill(
      null,
      path8.join(root, ".opencode", "skills", "repo-agent"),
      true,
      true
    );
    await updateManagedCommand(
      path8.join(root, ".opencode", "commands", "repo-agent.md"),
      null,
      true
    );
  }
  if (selectedTools.includes("codex")) {
    if (await updateManagedText(path8.join(root, ".codex", "config.toml"), "", dryRun) !== "skipped") {
      changed.push(".codex/config.toml");
    }
    if (await updateHooks(
      path8.join(root, ".codex", "hooks.json"),
      "codex",
      true,
      dryRun
    ) !== "skipped") changed.push(".codex/hooks.json");
    if (await syncManagedSkill(
      null,
      path8.join(root, ".agents", "skills", "repo-agent"),
      true,
      dryRun
    ) !== "skipped") changed.push(".agents/skills/repo-agent");
  }
  if (selectedTools.includes("claude-code")) {
    if (await updateJsonc(path8.join(root, ".mcp.json"), [
      { path: ["mcpServers", "repo-agent"], value: void 0 }
    ], dryRun) !== "skipped") changed.push(".mcp.json");
    if (await updateHooks(
      path8.join(root, ".claude", "settings.json"),
      "claude-code",
      true,
      dryRun
    ) !== "skipped") changed.push(".claude/settings.json");
    if (await syncManagedSkill(
      null,
      path8.join(root, ".claude", "skills", "repo-agent"),
      true,
      dryRun
    ) !== "skipped") changed.push(".claude/skills/repo-agent");
  }
  if (selectedTools.includes("opencode")) {
    if (await updateOpenCodeConfig(
      path8.join(root, "opencode.json"),
      true,
      dryRun
    ) !== "skipped") changed.push("opencode.json");
    if (await updateOwnedFile(
      path8.join(root, OPENCODE_PLUGIN_PATH),
      null,
      dryRun
    ) !== "skipped") changed.push(OPENCODE_PLUGIN_PATH);
    if (await syncManagedSkill(
      null,
      path8.join(root, ".opencode", "skills", "repo-agent"),
      true,
      dryRun
    ) !== "skipped") changed.push(".opencode/skills/repo-agent");
    if (await updateManagedCommand(
      path8.join(root, ".opencode", "commands", "repo-agent.md"),
      null,
      dryRun
    ) !== "skipped") changed.push(".opencode/commands/repo-agent.md");
  }
  if (!dryRun) {
    const statePath = path8.join(root, ".repo-agent-runtime", "activation.json");
    if (await exists(statePath)) await writeFile3(statePath, `${JSON.stringify({
      version: 1,
      state: "inactive",
      tools: selectedTools,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2)}
`);
  }
  return {
    ok: true,
    command: "deactivate",
    tool: selected,
    changed,
    dryRun,
    reloadRequired: true,
    reloadType: "new_session",
    message: "\u63A5\u5165\u914D\u7F6E\u5DF2\u79FB\u9664\uFF1B\u8BF7\u65B0\u5EFA\u4F1A\u8BDD\u4F7F\u53D8\u66F4\u5B8C\u5168\u751F\u6548\u3002"
  };
}

// src/commands/init.ts
var directories = [
  ".repo-agent/policies",
  ".repo-agent/hooks",
  ".repo-agent/memories/modules",
  ".repo-agent/memory_candidates",
  ".repo-agent/skills/approved",
  ".repo-agent/skills/candidates",
  ".repo-agent/fix_patterns/approved",
  ".repo-agent/fix_patterns/candidates",
  ".repo-agent/evals",
  ".repo-agent/adapters",
  ".repo-agent/tools",
  ".repo-agent/learning_inbox",
  ".repo-agent/catalog",
  ".repo-agent/review_lenses",
  ".repo-agent/workflows",
  ".repo-agent/generated/audits",
  ".repo-agent/generated/context_packs",
  ".repo-agent/generated/patches",
  ".repo-agent/generated/review_summaries",
  ".repo-agent/generated/stale_candidates",
  ".repo-agent/generated/tmp",
  ".repo-agent/generated/recurring_errors"
];
var display = (values) => values.length ? values.join(", ") : "\u672A\u68C0\u6D4B\u5230";
function initReport(profile, generated, updated, warnings) {
  const test = profile.testCommands;
  return `# repo-agent \u521D\u59CB\u5316\u62A5\u544A

\u751F\u6210\u65F6\u95F4\uFF1A${(/* @__PURE__ */ new Date()).toISOString()}

## \u9879\u76EE\u68C0\u6D4B\u7ED3\u679C

- \u8BED\u8A00\uFF1A${display(profile.language)}
- \u6846\u67B6\uFF1A${display(profile.framework)}
- \u5305\u7BA1\u7406\u5668\uFF1A${profile.packageManager ?? "\u672A\u68C0\u6D4B\u5230"}
- \u6D4B\u8BD5\u547D\u4EE4\uFF1A${test.unit ?? "\u672A\u68C0\u6D4B\u5230"}
- \u7C7B\u578B\u68C0\u67E5\u547D\u4EE4\uFF1A${test.typecheck ?? "\u672A\u68C0\u6D4B\u5230"}
- Lint \u547D\u4EE4\uFF1A${test.lint ?? "\u672A\u68C0\u6D4B\u5230"}

## \u6D41\u7A0B\u68C0\u6D4B\u7ED3\u679C

- OpenSpec\uFF1A${profile.process.hasOpenSpec ? "\u662F" : "\u5426"}
- ADR\uFF1A${profile.process.hasAdr ? "\u662F" : "\u5426"}
- AGENTS.md\uFF1A${profile.process.hasAgents ? "\u662F" : "\u5426"}
- SECURITY.md\uFF1A${profile.process.hasSecurity ? "\u662F" : "\u5426"}
- CI \u5DE5\u4F5C\u6D41\uFF1A${profile.process.hasCiWorkflows ? "\u662F" : "\u5426"}

## \u751F\u6210\u7684\u6587\u4EF6

${generated.map((item) => `- ${item}`).join("\n") || "- \u65E0\uFF08\u5DF2\u4FDD\u7559\u73B0\u6709\u6587\u4EF6\uFF09"}

## \u66F4\u65B0\u7684\u6587\u4EF6

${updated.map((item) => `- ${item}`).join("\n") || "- \u65E0"}

## \u9AD8\u98CE\u9669\u8DEF\u5F84

${profile.riskPaths.map((item) => `- ${item}`).join("\n")}

## \u8B66\u544A

${warnings.map((item) => `- ${item}`).join("\n") || "- \u65E0"}

## \u540E\u7EED\u6B65\u9AA4

1. \u5BA1\u6838 .repo-agent/config.yaml\u3002
2. \u5BA1\u6838 .repo-agent/commit_policy.yaml\u3002
3. \u5BA1\u6838 .repo-agent/hooks/routes.yaml \u4E2D\u7684 Hook Router\uFF08\u94A9\u5B50\u8DEF\u7531\uFF09\u3002
4. .gitignore \u5DF2\u81EA\u52A8\u533A\u5206\u56E2\u961F\u8D44\u4EA7\u4E0E\u672C\u5730\u3001\u79C1\u6709\u3001\u6D3E\u751F\u6587\u4EF6\uFF0C\u65E0\u9700\u624B\u5DE5\u7EF4\u62A4\u3002
5. \u56E2\u961F\u5171\u4EAB\u8D44\u4EA7\u5BA1\u6838\u901A\u8FC7\u540E\u518D\u63D0\u4EA4\u3002
`;
}
async function initializeProject(options) {
  const { root, mode, dryRun } = options;
  if (!await isWritable(root) && !dryRun) {
    throw new CliError("E_PERMISSION_DENIED", "\u9879\u76EE\u6839\u76EE\u5F55\u4E0D\u53EF\u5199\u3002", root);
  }
  await validateIntegrationSelection(
    root,
    options.tool ?? "all",
    options.entry ?? "auto"
  );
  if (await exists(path9.join(root, ".repo-agent", "hooks", "routes.yaml"))) {
    await loadHookRoutes(root);
  }
  const profile = await scanProject(root);
  const warnings = [];
  if (!profile.testCommands.unit) warnings.push("\u672A\u68C0\u6D4B\u5230\u6D4B\u8BD5\u547D\u4EE4\u3002");
  if (!profile.testCommands.typecheck) warnings.push("\u672A\u68C0\u6D4B\u5230\u7C7B\u578B\u68C0\u67E5\u547D\u4EE4\u3002");
  if (!profile.process.hasSecurity) warnings.push("\u672A\u68C0\u6D4B\u5230 SECURITY.md\u3002");
  const defaultFiles = /* @__PURE__ */ new Map([
    [".repo-agent/config.yaml", renderTemplate(templates.config, { MODE: mode })],
    [
      ".repo-agent/commit_policy.yaml",
      mode === "team" ? templates.teamCommitPolicy : templates.personalCommitPolicy
    ],
    [
      ".repo-agent/lock.yaml",
      `version: 1
repo_agent:
  asset_version: ${VERSION}
  template_version: ${VERSION}
  schema_version: ${VERSION}
  builtin_policy_version: ${VERSION}
  builtin_skill_version: ${VERSION}
  builtin_fix_pattern_version: ${VERSION}
generated_at: ${(/* @__PURE__ */ new Date()).toISOString()}
applied_migrations: []
managed_assets: {}
upgrade:
  state: complete
  target_version: ${VERSION}
  pending: []
`
    ],
    [".repo-agent/README.md", templates.usageGuide],
    [".repo-agent/policies/protected_files.yaml", templates.protectedFiles],
    [".repo-agent/policies/command_policy.yaml", templates.commandPolicy],
    [".repo-agent/policies/permissions.yaml", templates.permissions],
    [".repo-agent/hooks/routes.yaml", `version: 1
routes:
  session-start:
    handler: session_handshake
  user-prompt-submit:
    handler: task_preflight
    context_sources: [instructions, memories, skills, fix_patterns, candidates, recurring_errors]
    block_on_risk: [blocked]
  pre-tool-use:
    handler: tool_policy
  stop:
    handler: task_closure
    closure_steps: [commit_advice, audit_recorded, observation_captured, recurring_analyzed, lifecycle_evaluated, metrics_updated]
`],
    [".repo-agent/memories/repo.md", templates.memory("\u4ED3\u5E93", "\u8BB0\u5F55\u4ED3\u5E93\u7279\u6709\u7684\u7EA6\u5B9A\u548C\u8FB9\u754C\u3002")],
    [".repo-agent/memories/architecture.md", templates.memory("\u67B6\u6784", "\u8BB0\u5F55\u7ECF\u8FC7\u5BA1\u6838\u7684\u67B6\u6784\u51B3\u7B56\u548C\u7EA6\u675F\u3002")],
    [".repo-agent/memories/testing.md", templates.memory("\u6D4B\u8BD5", "\u8BB0\u5F55\u7ECF\u8FC7\u5BA1\u6838\u7684\u6D4B\u8BD5\u547D\u4EE4\u548C\u56DE\u5F52\u8981\u6C42\u3002")],
    [".repo-agent/memories/security.md", templates.memory("\u5B89\u5168", "\u8BB0\u5F55\u7ECF\u8FC7\u5BA1\u6838\u7684\u5B89\u5168\u8981\u6C42\u548C\u654F\u611F\u533A\u57DF\u3002")],
    [".repo-agent/skills/approved/bugfix.red-green-refactor.yaml", templates.skill],
    [".repo-agent/fix_patterns/approved/auth.oauth-invalid-state.yaml", templates.fixPattern],
    [".repo-agent/adapters/codex.yaml", `id: adapter.codex
name: Codex
version: 1
supports: { context_pack: true, hook: true, mcp: true, json_cli: true }
`],
    [".repo-agent/adapters/claude-code.yaml", `id: adapter.claude-code
name: Claude Code
version: 1
supports: { context_pack: true, hook: true, mcp: true, json_cli: true }
`],
    [".repo-agent/adapters/opencode.yaml", `id: adapter.opencode
name: OpenCode
version: 1
supports: { context_pack: true, plugin: true, mcp: true, json_cli: true }
`],
    [".repo-agent/tools/registry.yaml", `version: 1
tools:
  - { id: Read, type: read, risk: low }
  - { id: Grep, type: read, risk: low }
  - { id: Glob, type: read, risk: low }
  - { id: LS, type: read, risk: low }
  - { id: NotebookRead, type: read, risk: low }
  - { id: TodoWrite, type: planning, risk: low }
  - { id: update_plan, type: planning, risk: low }
  - { id: request_user_input, type: planning, risk: low }
  - { id: view_image, type: read, risk: low }
  - { id: tool_search_tool, type: read, risk: low }
  - { id: Task, type: planning, risk: low }
  - { id: SlashCommand, type: planning, risk: low }
  - { id: Write, type: write, risk: medium, requires_confirmation: true }
  - { id: Edit, type: write, risk: medium, requires_confirmation: true }
  - { id: NotebookEdit, type: write, risk: medium, requires_confirmation: true }
  - { id: ApplyPatch, type: write, risk: medium, requires_confirmation: true }
  - { id: Bash, type: command, risk: medium }
  - { id: BashOutput, type: command, risk: low }
  - { id: KillShell, type: command, risk: medium, requires_confirmation: true }
  - { id: WebFetch, type: network, risk: medium, requires_confirmation: true }
  - { id: WebSearch, type: network, risk: medium, requires_confirmation: true }
  - { id: tool.git.status, type: command, command: git status, risk: low }
  - { id: tool.git.commit, type: command, command: git commit, risk: medium, requires_confirmation: true }
  - { id: tool.network.fetch, type: network, risk: high, allowed: false }
`],
    [".repo-agent/tools/permissions.yaml", `version: 1
defaults: { network: deny, shell: allow_safe, git_write: require_confirmation }
blocked: [tool.network.fetch, tool.secret.read, tool.command.sudo]
requires_confirmation:
  - tool.git.commit
  - tool.git.push
  - tool.patch.apply
  - Write
  - Edit
  - NotebookEdit
  - ApplyPatch
  - KillShell
  - WebFetch
  - WebSearch
`],
    [".repo-agent/review_lenses/security.yaml", `id: review.security
applies_to: [src/auth/**, src/billing/**, .repo-agent/policies/**]
checks: [\u662F\u5426\u6CC4\u9732\u654F\u611F\u4FE1\u606F\uFF1F, \u662F\u5426\u53EF\u80FD\u7ED5\u8FC7\u8BA4\u8BC1\uFF1F, \u662F\u5426\u5305\u542B\u8D1F\u5411\u6D4B\u8BD5\uFF1F]
required_for: [high, blocked]
`],
    [".repo-agent/review_lenses/testing.yaml", `id: review.testing
applies_to: [src/**, tests/**]
checks: [\u662F\u5426\u5305\u542B\u56DE\u5F52\u6D4B\u8BD5\uFF1F, \u662F\u5426\u8FD0\u884C\u4E86\u76F8\u5173\u6D4B\u8BD5\uFF1F]
required_for: [medium, high, blocked]
`],
    [".repo-agent/review_lenses/database.yaml", `id: review.database
applies_to: [database/migrations/**]
checks: [\u56DE\u6EDA\u662F\u5426\u5B89\u5168\uFF1F, \u662F\u5426\u53EF\u80FD\u4E22\u5931\u6570\u636E\uFF1F]
required_for: [high, blocked]
`],
    [".repo-agent/workflows/bugfix.yaml", `id: workflow.bugfix
version: 1
steps: [get_context_pack, check_policy, recommend_tests, external_agent_action, record_trace, classify_learning, get_commit_options]
`],
    [".repo-agent/workflows/security-change.yaml", `id: workflow.security-change
version: 1
steps: [get_context_pack, check_policy, collect_evidence, external_agent_action, run_negative_tests, record_trace, get_commit_options]
`],
    [".repo-agent/workflows/feature.yaml", `id: workflow.feature
version: 1
steps: [get_context_pack, check_policy, recommend_tests, external_agent_action, run_tests, record_trace, get_commit_options]
`],
    [".repo-agent/fix_patterns/error_aliases.yaml", `version: 1
aliases:
  error.auth.oauth-invalid-state:
    title: OAuth state \u65E0\u6548
    keywords: [invalid oauth state, state mismatch, csrf state validation failed, oauth callback state mismatch]
    scope: [src/auth/**, tests/auth/**]
`],
    [".repo-agent/catalog/skills.index.yaml", `skills:
  - { id: skill.bugfix.red-green-refactor, status: approved, weight: 0.8 }
`],
    [".repo-agent/catalog/memories.index.yaml", `memories:
  - { id: memory.repo, status: approved, weight: 0.7 }
  - { id: memory.architecture, status: approved, weight: 0.7 }
  - { id: memory.testing, status: approved, weight: 0.7 }
  - { id: memory.security, status: approved, weight: 0.7 }
`],
    [".repo-agent/catalog/fix_patterns.index.yaml", `fix_patterns:
  - { id: fix.auth.oauth-invalid-state, status: approved, weight: 0.7 }
`],
    [".repo-agent/catalog/candidates.index.yaml", "candidates: []\n"],
    [".repo-agent/generated/gitignore_suggestion.txt", gitignoreSuggestion()]
  ]);
  const files = new Map(defaultFiles);
  const created = [];
  const updated = [];
  const skipped = [];
  const wouldCreate = [];
  const wouldUpdate = [];
  for (const directory of directories) {
    if (!dryRun) await mkdir3(path9.join(root, directory), { recursive: true });
  }
  for (const [relativePath, content] of files) {
    const target = path9.join(root, relativePath);
    if (await exists(target)) {
      skipped.push(relativePath);
    } else if (dryRun) {
      wouldCreate.push(relativePath);
    } else {
      const result = await writeFileExclusive(target, content);
      (result === "created" ? created : skipped).push(relativePath);
    }
  }
  const gitignoreResult = await ensureManagedGitignore(root, dryRun);
  if (gitignoreResult.action === "created") created.push(".gitignore");
  if (gitignoreResult.action === "updated") updated.push(".gitignore");
  if (gitignoreResult.action === "skipped") skipped.push(".gitignore");
  if (gitignoreResult.action === "wouldCreate") wouldCreate.push(".gitignore");
  if (gitignoreResult.action === "wouldUpdate") wouldUpdate.push(".gitignore");
  const activation = await activateIntegrations(
    root,
    options.tool ?? "all",
    dryRun,
    options.entry ?? "auto"
  );
  const reportPath = ".repo-agent/generated/init_report.md";
  if (await exists(path9.join(root, reportPath))) {
    skipped.push(reportPath);
  } else if (dryRun) {
    wouldCreate.push(reportPath);
  } else {
    const generatedReport = initReport(profile, created, updated, warnings);
    const result = await writeFileExclusive(path9.join(root, reportPath), generatedReport);
    (result === "created" ? created : skipped).push(reportPath);
  }
  return {
    ok: true,
    command: "init",
    mode,
    dryRun,
    root,
    created,
    updated,
    skipped,
    wouldCreate,
    wouldUpdate,
    detectedProject: profile,
    warnings,
    activation
  };
}

// src/commands/validate.ts
import path13 from "node:path";
import { readFile as readFile6 } from "node:fs/promises";

// src/core/secret-redactor.ts
var secretKey = String.raw`(?:api[_-]?key|apikey|secret|token|password|private[_-]?key|client[_-]?secret|access[_-]?key)`;
var keyedSecret = new RegExp(
  String.raw`\b(${secretKey})\b\s*(?::|=|\bis\b)\s*["']?([^\s"',}]+)`,
  "gi"
);
var bearerSecret = /\b(?:authorization\s*[:=]?\s*)?bearer\s+([a-z0-9._~+/-]{8,})/gi;
var jwtSecret = /\beyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\b/g;
var awsAccessKey = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g;
var githubToken = /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g;
var privateKeyBlock = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi;
var privateKeyHeader = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i;
function containsPossibleSecret(input) {
  return new RegExp(keyedSecret.source, "i").test(input) || new RegExp(bearerSecret.source, "i").test(input) || new RegExp(jwtSecret.source).test(input) || new RegExp(awsAccessKey.source).test(input) || new RegExp(githubToken.source).test(input) || privateKeyHeader.test(input);
}
function redactSecrets(input) {
  return input.replace(new RegExp(keyedSecret.source, "gi"), (_match, key) => `${key}=[REDACTED]`).replace(new RegExp(bearerSecret.source, "gi"), "Bearer [REDACTED]").replace(new RegExp(jwtSecret.source, "g"), "[REDACTED JWT]").replace(new RegExp(awsAccessKey.source, "g"), "[REDACTED ACCESS KEY]").replace(new RegExp(githubToken.source, "g"), "[REDACTED TOKEN]").replace(new RegExp(privateKeyBlock.source, "gi"), "[REDACTED PRIVATE KEY]");
}
function redactSecretValues(value, key = "") {
  if (new RegExp(`^${secretKey}$`, "i").test(key)) return "[REDACTED]";
  if (typeof value === "string") return redactSecrets(value);
  if (Array.isArray(value)) return value.map((item) => redactSecretValues(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [
        childKey,
        redactSecretValues(child, childKey)
      ])
    );
  }
  return value;
}

// src/core/conflict-resolver.ts
function localPolicyConflicts(local) {
  const conflicts = [];
  const audit = local.audit;
  const network = local.network;
  const serialized = JSON.stringify(local);
  if (audit?.enabled === false || network?.mode === "unrestricted" || /"dangerous_commands"\s*:/.test(serialized) || /"protected_files"\s*:/.test(serialized)) {
    conflicts.push({
      type: "local_vs_project",
      winner: "\u4ED3\u5E93\u6B63\u5F0F\u6CBB\u7406\u7B56\u7565",
      loser: "\u672C\u5730\u8986\u76D6\u914D\u7F6E",
      reason: "\u4E2A\u4EBA\u914D\u7F6E\u53EA\u80FD\u6536\u7D27\u9879\u76EE\u7B56\u7565\uFF0C\u4E0D\u80FD\u653E\u5BBD\u3002",
      suggestedAction: "ignore_loser"
    });
  }
  return conflicts;
}

// src/utils/path-match.ts
import path11 from "node:path";

// node_modules/minimatch/dist/esm/index.js
var import_brace_expansion = __toESM(require_brace_expansion(), 1);

// node_modules/minimatch/dist/esm/assert-valid-pattern.js
var MAX_PATTERN_LENGTH = 1024 * 64;
var assertValidPattern = (pattern) => {
  if (typeof pattern !== "string") {
    throw new TypeError("invalid pattern");
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError("pattern is too long");
  }
};

// node_modules/minimatch/dist/esm/brace-expressions.js
var posixClasses = {
  "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true],
  "[:alpha:]": ["\\p{L}\\p{Nl}", true],
  "[:ascii:]": ["\\x00-\\x7f", false],
  "[:blank:]": ["\\p{Zs}\\t", true],
  "[:cntrl:]": ["\\p{Cc}", true],
  "[:digit:]": ["\\p{Nd}", true],
  "[:graph:]": ["\\p{Z}\\p{C}", true, true],
  "[:lower:]": ["\\p{Ll}", true],
  "[:print:]": ["\\p{C}", true],
  "[:punct:]": ["\\p{P}", true],
  "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true],
  "[:upper:]": ["\\p{Lu}", true],
  "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true],
  "[:xdigit:]": ["A-Fa-f0-9", false]
};
var braceEscape = (s) => s.replace(/[[\]\\-]/g, "\\$&");
var regexpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var rangesToString = (ranges) => ranges.join("");
var parseClass = (glob, position) => {
  const pos = position;
  if (glob.charAt(pos) !== "[") {
    throw new Error("not in a brace expression");
  }
  const ranges = [];
  const negs = [];
  let i2 = pos + 1;
  let sawStart = false;
  let uflag = false;
  let escaping = false;
  let negate = false;
  let endPos = pos;
  let rangeStart = "";
  WHILE: while (i2 < glob.length) {
    const c = glob.charAt(i2);
    if ((c === "!" || c === "^") && i2 === pos + 1) {
      negate = true;
      i2++;
      continue;
    }
    if (c === "]" && sawStart && !escaping) {
      endPos = i2 + 1;
      break;
    }
    sawStart = true;
    if (c === "\\") {
      if (!escaping) {
        escaping = true;
        i2++;
        continue;
      }
    }
    if (c === "[" && !escaping) {
      for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) {
        if (glob.startsWith(cls, i2)) {
          if (rangeStart) {
            return ["$.", false, glob.length - pos, true];
          }
          i2 += cls.length;
          if (neg)
            negs.push(unip);
          else
            ranges.push(unip);
          uflag = uflag || u;
          continue WHILE;
        }
      }
    }
    escaping = false;
    if (rangeStart) {
      if (c > rangeStart) {
        ranges.push(braceEscape(rangeStart) + "-" + braceEscape(c));
      } else if (c === rangeStart) {
        ranges.push(braceEscape(c));
      }
      rangeStart = "";
      i2++;
      continue;
    }
    if (glob.startsWith("-]", i2 + 1)) {
      ranges.push(braceEscape(c + "-"));
      i2 += 2;
      continue;
    }
    if (glob.startsWith("-", i2 + 1)) {
      rangeStart = c;
      i2 += 2;
      continue;
    }
    ranges.push(braceEscape(c));
    i2++;
  }
  if (endPos < i2) {
    return ["", false, 0, false];
  }
  if (!ranges.length && !negs.length) {
    return ["$.", false, glob.length - pos, true];
  }
  if (negs.length === 0 && ranges.length === 1 && /^\\?.$/.test(ranges[0]) && !negate) {
    const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
    return [regexpEscape(r), false, endPos - pos, false];
  }
  const sranges = "[" + (negate ? "^" : "") + rangesToString(ranges) + "]";
  const snegs = "[" + (negate ? "" : "^") + rangesToString(negs) + "]";
  const comb = ranges.length && negs.length ? "(" + sranges + "|" + snegs + ")" : ranges.length ? sranges : snegs;
  return [comb, uflag, endPos - pos, true];
};

// node_modules/minimatch/dist/esm/unescape.js
var unescape = (s, { windowsPathsNoEscape = false } = {}) => {
  return windowsPathsNoEscape ? s.replace(/\[([^\/\\])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^\/\\])\]/g, "$1$2").replace(/\\([^\/])/g, "$1");
};

// node_modules/minimatch/dist/esm/ast.js
var _a;
var types = /* @__PURE__ */ new Set(["!", "?", "+", "*", "@"]);
var isExtglobType = (c) => types.has(c);
var isExtglobAST = (c) => isExtglobType(c.type);
var adoptionMap = /* @__PURE__ */ new Map([
  ["!", ["@"]],
  ["?", ["?", "@"]],
  ["@", ["@"]],
  ["*", ["*", "+", "?", "@"]],
  ["+", ["+", "@"]]
]);
var adoptionWithSpaceMap = /* @__PURE__ */ new Map([
  ["!", ["?"]],
  ["@", ["?"]],
  ["+", ["?", "*"]]
]);
var adoptionAnyMap = /* @__PURE__ */ new Map([
  ["!", ["?", "@"]],
  ["?", ["?", "@"]],
  ["@", ["?", "@"]],
  ["*", ["*", "+", "?", "@"]],
  ["+", ["+", "@", "?", "*"]]
]);
var usurpMap = /* @__PURE__ */ new Map([
  ["!", /* @__PURE__ */ new Map([["!", "@"]])],
  ["?", /* @__PURE__ */ new Map([["*", "*"], ["+", "*"]])],
  ["@", /* @__PURE__ */ new Map([["!", "!"], ["?", "?"], ["@", "@"], ["*", "*"], ["+", "+"]])],
  ["+", /* @__PURE__ */ new Map([["?", "*"], ["*", "*"]])]
]);
var startNoTraversal = "(?!(?:^|/)\\.\\.?(?:$|/))";
var startNoDot = "(?!\\.)";
var addPatternStart = /* @__PURE__ */ new Set(["[", "."]);
var justDots = /* @__PURE__ */ new Set(["..", "."]);
var reSpecials = new Set("().*{}+?[]^$\\!");
var regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var qmark = "[^/]";
var star = qmark + "*?";
var starNoEmpty = qmark + "+?";
var AST = class {
  type;
  #root;
  #hasMagic;
  #uflag = false;
  #parts = [];
  #parent;
  #parentIndex;
  #negs;
  #filledNegs = false;
  #options;
  #toString;
  // set to true if it's an extglob with no children
  // (which really means one child of '')
  #emptyExt = false;
  constructor(type, parent, options = {}) {
    this.type = type;
    if (type)
      this.#hasMagic = true;
    this.#parent = parent;
    this.#root = this.#parent ? this.#parent.#root : this;
    this.#options = this.#root === this ? options : this.#root.#options;
    this.#negs = this.#root === this ? [] : this.#root.#negs;
    if (type === "!" && !this.#root.#filledNegs)
      this.#negs.push(this);
    this.#parentIndex = this.#parent ? this.#parent.#parts.length : 0;
  }
  get hasMagic() {
    if (this.#hasMagic !== void 0)
      return this.#hasMagic;
    for (const p of this.#parts) {
      if (typeof p === "string")
        continue;
      if (p.type || p.hasMagic)
        return this.#hasMagic = true;
    }
    return this.#hasMagic;
  }
  // reconstructs the pattern
  toString() {
    if (this.#toString !== void 0)
      return this.#toString;
    if (!this.type) {
      return this.#toString = this.#parts.map((p) => String(p)).join("");
    } else {
      return this.#toString = this.type + "(" + this.#parts.map((p) => String(p)).join("|") + ")";
    }
  }
  #fillNegs() {
    if (this !== this.#root)
      throw new Error("should only call on root");
    if (this.#filledNegs)
      return this;
    this.toString();
    this.#filledNegs = true;
    let n;
    while (n = this.#negs.pop()) {
      if (n.type !== "!")
        continue;
      let p = n;
      let pp = p.#parent;
      while (pp) {
        for (let i2 = p.#parentIndex + 1; !pp.type && i2 < pp.#parts.length; i2++) {
          for (const part of n.#parts) {
            if (typeof part === "string") {
              throw new Error("string part in extglob AST??");
            }
            part.copyIn(pp.#parts[i2]);
          }
        }
        p = pp;
        pp = p.#parent;
      }
    }
    return this;
  }
  push(...parts) {
    for (const p of parts) {
      if (p === "")
        continue;
      if (typeof p !== "string" && !(p instanceof _a && p.#parent === this)) {
        throw new Error("invalid part: " + p);
      }
      this.#parts.push(p);
    }
  }
  toJSON() {
    const ret = this.type === null ? this.#parts.slice().map((p) => typeof p === "string" ? p : p.toJSON()) : [this.type, ...this.#parts.map((p) => p.toJSON())];
    if (this.isStart() && !this.type)
      ret.unshift([]);
    if (this.isEnd() && (this === this.#root || this.#root.#filledNegs && this.#parent?.type === "!")) {
      ret.push({});
    }
    return ret;
  }
  isStart() {
    if (this.#root === this)
      return true;
    if (!this.#parent?.isStart())
      return false;
    if (this.#parentIndex === 0)
      return true;
    const p = this.#parent;
    for (let i2 = 0; i2 < this.#parentIndex; i2++) {
      const pp = p.#parts[i2];
      if (!(pp instanceof _a && pp.type === "!")) {
        return false;
      }
    }
    return true;
  }
  isEnd() {
    if (this.#root === this)
      return true;
    if (this.#parent?.type === "!")
      return true;
    if (!this.#parent?.isEnd())
      return false;
    if (!this.type)
      return this.#parent?.isEnd();
    const pl = this.#parent ? this.#parent.#parts.length : 0;
    return this.#parentIndex === pl - 1;
  }
  copyIn(part) {
    if (typeof part === "string")
      this.push(part);
    else
      this.push(part.clone(this));
  }
  clone(parent) {
    const c = new _a(this.type, parent);
    for (const p of this.#parts) {
      c.copyIn(p);
    }
    return c;
  }
  static #parseAST(str, ast, pos, opt, extDepth) {
    const maxDepth = opt.maxExtglobRecursion ?? 2;
    let escaping = false;
    let inBrace = false;
    let braceStart = -1;
    let braceNeg = false;
    if (ast.type === null) {
      let i3 = pos;
      let acc2 = "";
      while (i3 < str.length) {
        const c = str.charAt(i3++);
        if (escaping || c === "\\") {
          escaping = !escaping;
          acc2 += c;
          continue;
        }
        if (inBrace) {
          if (i3 === braceStart + 1) {
            if (c === "^" || c === "!") {
              braceNeg = true;
            }
          } else if (c === "]" && !(i3 === braceStart + 2 && braceNeg)) {
            inBrace = false;
          }
          acc2 += c;
          continue;
        } else if (c === "[") {
          inBrace = true;
          braceStart = i3;
          braceNeg = false;
          acc2 += c;
          continue;
        }
        const doRecurse = !opt.noext && isExtglobType(c) && str.charAt(i3) === "(" && extDepth <= maxDepth;
        if (doRecurse) {
          ast.push(acc2);
          acc2 = "";
          const ext2 = new _a(c, ast);
          i3 = _a.#parseAST(str, ext2, i3, opt, extDepth + 1);
          ast.push(ext2);
          continue;
        }
        acc2 += c;
      }
      ast.push(acc2);
      return i3;
    }
    let i2 = pos + 1;
    let part = new _a(null, ast);
    const parts = [];
    let acc = "";
    while (i2 < str.length) {
      const c = str.charAt(i2++);
      if (escaping || c === "\\") {
        escaping = !escaping;
        acc += c;
        continue;
      }
      if (inBrace) {
        if (i2 === braceStart + 1) {
          if (c === "^" || c === "!") {
            braceNeg = true;
          }
        } else if (c === "]" && !(i2 === braceStart + 2 && braceNeg)) {
          inBrace = false;
        }
        acc += c;
        continue;
      } else if (c === "[") {
        inBrace = true;
        braceStart = i2;
        braceNeg = false;
        acc += c;
        continue;
      }
      const doRecurse = isExtglobType(c) && str.charAt(i2) === "(" && /* c8 ignore start - the maxDepth is sufficient here */
      (extDepth <= maxDepth || ast && ast.#canAdoptType(c));
      if (doRecurse) {
        const depthAdd = ast && ast.#canAdoptType(c) ? 0 : 1;
        part.push(acc);
        acc = "";
        const ext2 = new _a(c, part);
        part.push(ext2);
        i2 = _a.#parseAST(str, ext2, i2, opt, extDepth + depthAdd);
        continue;
      }
      if (c === "|") {
        part.push(acc);
        acc = "";
        parts.push(part);
        part = new _a(null, ast);
        continue;
      }
      if (c === ")") {
        if (acc === "" && ast.#parts.length === 0) {
          ast.#emptyExt = true;
        }
        part.push(acc);
        acc = "";
        ast.push(...parts, part);
        return i2;
      }
      acc += c;
    }
    ast.type = null;
    ast.#hasMagic = void 0;
    ast.#parts = [str.substring(pos - 1)];
    return i2;
  }
  #canAdoptWithSpace(child) {
    return this.#canAdopt(child, adoptionWithSpaceMap);
  }
  #canAdopt(child, map = adoptionMap) {
    if (!child || typeof child !== "object" || child.type !== null || child.#parts.length !== 1 || this.type === null) {
      return false;
    }
    const gc = child.#parts[0];
    if (!gc || typeof gc !== "object" || gc.type === null) {
      return false;
    }
    return this.#canAdoptType(gc.type, map);
  }
  #canAdoptType(c, map = adoptionAnyMap) {
    return !!map.get(this.type)?.includes(c);
  }
  #adoptWithSpace(child, index) {
    const gc = child.#parts[0];
    const blank = new _a(null, gc, this.options);
    blank.#parts.push("");
    gc.push(blank);
    this.#adopt(child, index);
  }
  #adopt(child, index) {
    const gc = child.#parts[0];
    this.#parts.splice(index, 1, ...gc.#parts);
    for (const p of gc.#parts) {
      if (typeof p === "object")
        p.#parent = this;
    }
    this.#toString = void 0;
  }
  #canUsurpType(c) {
    const m = usurpMap.get(this.type);
    return !!m?.has(c);
  }
  #canUsurp(child) {
    if (!child || typeof child !== "object" || child.type !== null || child.#parts.length !== 1 || this.type === null || this.#parts.length !== 1) {
      return false;
    }
    const gc = child.#parts[0];
    if (!gc || typeof gc !== "object" || gc.type === null) {
      return false;
    }
    return this.#canUsurpType(gc.type);
  }
  #usurp(child) {
    const m = usurpMap.get(this.type);
    const gc = child.#parts[0];
    const nt = m?.get(gc.type);
    if (!nt)
      return false;
    this.#parts = gc.#parts;
    for (const p of this.#parts) {
      if (typeof p === "object")
        p.#parent = this;
    }
    this.type = nt;
    this.#toString = void 0;
    this.#emptyExt = false;
  }
  #flatten() {
    if (!isExtglobAST(this)) {
      for (const p of this.#parts) {
        if (typeof p === "object")
          p.#flatten();
      }
    } else {
      let iterations = 0;
      let done = false;
      do {
        done = true;
        for (let i2 = 0; i2 < this.#parts.length; i2++) {
          const c = this.#parts[i2];
          if (typeof c === "object") {
            c.#flatten();
            if (this.#canAdopt(c)) {
              done = false;
              this.#adopt(c, i2);
            } else if (this.#canAdoptWithSpace(c)) {
              done = false;
              this.#adoptWithSpace(c, i2);
            } else if (this.#canUsurp(c)) {
              done = false;
              this.#usurp(c);
            }
          }
        }
      } while (!done && ++iterations < 10);
    }
    this.#toString = void 0;
  }
  static fromGlob(pattern, options = {}) {
    const ast = new _a(null, void 0, options);
    _a.#parseAST(pattern, ast, 0, options, 0);
    return ast;
  }
  // returns the regular expression if there's magic, or the unescaped
  // string if not.
  toMMPattern() {
    if (this !== this.#root)
      return this.#root.toMMPattern();
    const glob = this.toString();
    const [re, body, hasMagic, uflag] = this.toRegExpSource();
    const anyMagic = hasMagic || this.#hasMagic || this.#options.nocase && !this.#options.nocaseMagicOnly && glob.toUpperCase() !== glob.toLowerCase();
    if (!anyMagic) {
      return body;
    }
    const flags = (this.#options.nocase ? "i" : "") + (uflag ? "u" : "");
    return Object.assign(new RegExp(`^${re}$`, flags), {
      _src: re,
      _glob: glob
    });
  }
  get options() {
    return this.#options;
  }
  // returns the string match, the regexp source, whether there's magic
  // in the regexp (so a regular expression is required) and whether or
  // not the uflag is needed for the regular expression (for posix classes)
  // TODO: instead of injecting the start/end at this point, just return
  // the BODY of the regexp, along with the start/end portions suitable
  // for binding the start/end in either a joined full-path makeRe context
  // (where we bind to (^|/), or a standalone matchPart context (where
  // we bind to ^, and not /).  Otherwise slashes get duped!
  //
  // In part-matching mode, the start is:
  // - if not isStart: nothing
  // - if traversal possible, but not allowed: ^(?!\.\.?$)
  // - if dots allowed or not possible: ^
  // - if dots possible and not allowed: ^(?!\.)
  // end is:
  // - if not isEnd(): nothing
  // - else: $
  //
  // In full-path matching mode, we put the slash at the START of the
  // pattern, so start is:
  // - if first pattern: same as part-matching mode
  // - if not isStart(): nothing
  // - if traversal possible, but not allowed: /(?!\.\.?(?:$|/))
  // - if dots allowed or not possible: /
  // - if dots possible and not allowed: /(?!\.)
  // end is:
  // - if last pattern, same as part-matching mode
  // - else nothing
  //
  // Always put the (?:$|/) on negated tails, though, because that has to be
  // there to bind the end of the negated pattern portion, and it's easier to
  // just stick it in now rather than try to inject it later in the middle of
  // the pattern.
  //
  // We can just always return the same end, and leave it up to the caller
  // to know whether it's going to be used joined or in parts.
  // And, if the start is adjusted slightly, can do the same there:
  // - if not isStart: nothing
  // - if traversal possible, but not allowed: (?:/|^)(?!\.\.?$)
  // - if dots allowed or not possible: (?:/|^)
  // - if dots possible and not allowed: (?:/|^)(?!\.)
  //
  // But it's better to have a simpler binding without a conditional, for
  // performance, so probably better to return both start options.
  //
  // Then the caller just ignores the end if it's not the first pattern,
  // and the start always gets applied.
  //
  // But that's always going to be $ if it's the ending pattern, or nothing,
  // so the caller can just attach $ at the end of the pattern when building.
  //
  // So the todo is:
  // - better detect what kind of start is needed
  // - return both flavors of starting pattern
  // - attach $ at the end of the pattern when creating the actual RegExp
  //
  // Ah, but wait, no, that all only applies to the root when the first pattern
  // is not an extglob. If the first pattern IS an extglob, then we need all
  // that dot prevention biz to live in the extglob portions, because eg
  // +(*|.x*) can match .xy but not .yx.
  //
  // So, return the two flavors if it's #root and the first child is not an
  // AST, otherwise leave it to the child AST to handle it, and there,
  // use the (?:^|/) style of start binding.
  //
  // Even simplified further:
  // - Since the start for a join is eg /(?!\.) and the start for a part
  // is ^(?!\.), we can just prepend (?!\.) to the pattern (either root
  // or start or whatever) and prepend ^ or / at the Regexp construction.
  toRegExpSource(allowDot) {
    const dot = allowDot ?? !!this.#options.dot;
    if (this.#root === this) {
      this.#flatten();
      this.#fillNegs();
    }
    if (!isExtglobAST(this)) {
      const noEmpty = this.isStart() && this.isEnd();
      const src = this.#parts.map((p) => {
        const [re, _, hasMagic, uflag] = typeof p === "string" ? _a.#parseGlob(p, this.#hasMagic, noEmpty) : p.toRegExpSource(allowDot);
        this.#hasMagic = this.#hasMagic || hasMagic;
        this.#uflag = this.#uflag || uflag;
        return re;
      }).join("");
      let start3 = "";
      if (this.isStart()) {
        if (typeof this.#parts[0] === "string") {
          const dotTravAllowed = this.#parts.length === 1 && justDots.has(this.#parts[0]);
          if (!dotTravAllowed) {
            const aps = addPatternStart;
            const needNoTrav = (
              // dots are allowed, and the pattern starts with [ or .
              dot && aps.has(src.charAt(0)) || // the pattern starts with \., and then [ or .
              src.startsWith("\\.") && aps.has(src.charAt(2)) || // the pattern starts with \.\., and then [ or .
              src.startsWith("\\.\\.") && aps.has(src.charAt(4))
            );
            const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
            start3 = needNoTrav ? startNoTraversal : needNoDot ? startNoDot : "";
          }
        }
      }
      let end2 = "";
      if (this.isEnd() && this.#root.#filledNegs && this.#parent?.type === "!") {
        end2 = "(?:$|\\/)";
      }
      const final2 = start3 + src + end2;
      return [
        final2,
        unescape(src),
        this.#hasMagic = !!this.#hasMagic,
        this.#uflag
      ];
    }
    const repeated = this.type === "*" || this.type === "+";
    const start2 = this.type === "!" ? "(?:(?!(?:" : "(?:";
    let body = this.#partsToRegExp(dot);
    if (this.isStart() && this.isEnd() && !body && this.type !== "!") {
      const s = this.toString();
      const me = this;
      me.#parts = [s];
      me.type = null;
      me.#hasMagic = void 0;
      return [s, unescape(this.toString()), false, false];
    }
    let bodyDotAllowed = !repeated || allowDot || dot || !startNoDot ? "" : this.#partsToRegExp(true);
    if (bodyDotAllowed === body) {
      bodyDotAllowed = "";
    }
    if (bodyDotAllowed) {
      body = `(?:${body})(?:${bodyDotAllowed})*?`;
    }
    let final = "";
    if (this.type === "!" && this.#emptyExt) {
      final = (this.isStart() && !dot ? startNoDot : "") + starNoEmpty;
    } else {
      const close = this.type === "!" ? (
        // !() must match something,but !(x) can match ''
        "))" + (this.isStart() && !dot && !allowDot ? startNoDot : "") + star + ")"
      ) : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && bodyDotAllowed ? ")" : this.type === "*" && bodyDotAllowed ? `)?` : `)${this.type}`;
      final = start2 + body + close;
    }
    return [
      final,
      unescape(body),
      this.#hasMagic = !!this.#hasMagic,
      this.#uflag
    ];
  }
  #partsToRegExp(dot) {
    return this.#parts.map((p) => {
      if (typeof p === "string") {
        throw new Error("string type in extglob ast??");
      }
      const [re, _, _hasMagic, uflag] = p.toRegExpSource(dot);
      this.#uflag = this.#uflag || uflag;
      return re;
    }).filter((p) => !(this.isStart() && this.isEnd()) || !!p).join("|");
  }
  static #parseGlob(glob, hasMagic, noEmpty = false) {
    let escaping = false;
    let re = "";
    let uflag = false;
    let inStar = false;
    for (let i2 = 0; i2 < glob.length; i2++) {
      const c = glob.charAt(i2);
      if (escaping) {
        escaping = false;
        re += (reSpecials.has(c) ? "\\" : "") + c;
        inStar = false;
        continue;
      }
      if (c === "\\") {
        if (i2 === glob.length - 1) {
          re += "\\\\";
        } else {
          escaping = true;
        }
        continue;
      }
      if (c === "[") {
        const [src, needUflag, consumed, magic] = parseClass(glob, i2);
        if (consumed) {
          re += src;
          uflag = uflag || needUflag;
          i2 += consumed - 1;
          hasMagic = hasMagic || magic;
          inStar = false;
          continue;
        }
      }
      if (c === "*") {
        if (inStar)
          continue;
        inStar = true;
        re += noEmpty && /^[*]+$/.test(glob) ? starNoEmpty : star;
        hasMagic = true;
        continue;
      } else {
        inStar = false;
      }
      if (c === "?") {
        re += qmark;
        hasMagic = true;
        continue;
      }
      re += regExpEscape(c);
    }
    return [re, unescape(glob), !!hasMagic, uflag];
  }
};
_a = AST;

// node_modules/minimatch/dist/esm/escape.js
var escape = (s, { windowsPathsNoEscape = false } = {}) => {
  return windowsPathsNoEscape ? s.replace(/[?*()[\]]/g, "[$&]") : s.replace(/[?*()[\]\\]/g, "\\$&");
};

// node_modules/minimatch/dist/esm/index.js
var minimatch = (p, pattern, options = {}) => {
  assertValidPattern(pattern);
  if (!options.nocomment && pattern.charAt(0) === "#") {
    return false;
  }
  return new Minimatch(pattern, options).match(p);
};
var starDotExtRE = /^\*+([^+@!?\*\[\(]*)$/;
var starDotExtTest = (ext2) => (f) => !f.startsWith(".") && f.endsWith(ext2);
var starDotExtTestDot = (ext2) => (f) => f.endsWith(ext2);
var starDotExtTestNocase = (ext2) => {
  ext2 = ext2.toLowerCase();
  return (f) => !f.startsWith(".") && f.toLowerCase().endsWith(ext2);
};
var starDotExtTestNocaseDot = (ext2) => {
  ext2 = ext2.toLowerCase();
  return (f) => f.toLowerCase().endsWith(ext2);
};
var starDotStarRE = /^\*+\.\*+$/;
var starDotStarTest = (f) => !f.startsWith(".") && f.includes(".");
var starDotStarTestDot = (f) => f !== "." && f !== ".." && f.includes(".");
var dotStarRE = /^\.\*+$/;
var dotStarTest = (f) => f !== "." && f !== ".." && f.startsWith(".");
var starRE = /^\*+$/;
var starTest = (f) => f.length !== 0 && !f.startsWith(".");
var starTestDot = (f) => f.length !== 0 && f !== "." && f !== "..";
var qmarksRE = /^\?+([^+@!?\*\[\(]*)?$/;
var qmarksTestNocase = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExt([$0]);
  if (!ext2)
    return noext;
  ext2 = ext2.toLowerCase();
  return (f) => noext(f) && f.toLowerCase().endsWith(ext2);
};
var qmarksTestNocaseDot = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExtDot([$0]);
  if (!ext2)
    return noext;
  ext2 = ext2.toLowerCase();
  return (f) => noext(f) && f.toLowerCase().endsWith(ext2);
};
var qmarksTestDot = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExtDot([$0]);
  return !ext2 ? noext : (f) => noext(f) && f.endsWith(ext2);
};
var qmarksTest = ([$0, ext2 = ""]) => {
  const noext = qmarksTestNoExt([$0]);
  return !ext2 ? noext : (f) => noext(f) && f.endsWith(ext2);
};
var qmarksTestNoExt = ([$0]) => {
  const len = $0.length;
  return (f) => f.length === len && !f.startsWith(".");
};
var qmarksTestNoExtDot = ([$0]) => {
  const len = $0.length;
  return (f) => f.length === len && f !== "." && f !== "..";
};
var defaultPlatform = typeof process === "object" && process ? typeof process.env === "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
var path10 = {
  win32: { sep: "\\" },
  posix: { sep: "/" }
};
var sep = defaultPlatform === "win32" ? path10.win32.sep : path10.posix.sep;
minimatch.sep = sep;
var GLOBSTAR = /* @__PURE__ */ Symbol("globstar **");
minimatch.GLOBSTAR = GLOBSTAR;
var qmark2 = "[^/]";
var star2 = qmark2 + "*?";
var twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
var twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
var filter = (pattern, options = {}) => (p) => minimatch(p, pattern, options);
minimatch.filter = filter;
var ext = (a, b = {}) => Object.assign({}, a, b);
var defaults = (def) => {
  if (!def || typeof def !== "object" || !Object.keys(def).length) {
    return minimatch;
  }
  const orig = minimatch;
  const m = (p, pattern, options = {}) => orig(p, pattern, ext(def, options));
  return Object.assign(m, {
    Minimatch: class Minimatch extends orig.Minimatch {
      constructor(pattern, options = {}) {
        super(pattern, ext(def, options));
      }
      static defaults(options) {
        return orig.defaults(ext(def, options)).Minimatch;
      }
    },
    AST: class AST extends orig.AST {
      /* c8 ignore start */
      constructor(type, parent, options = {}) {
        super(type, parent, ext(def, options));
      }
      /* c8 ignore stop */
      static fromGlob(pattern, options = {}) {
        return orig.AST.fromGlob(pattern, ext(def, options));
      }
    },
    unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
    escape: (s, options = {}) => orig.escape(s, ext(def, options)),
    filter: (pattern, options = {}) => orig.filter(pattern, ext(def, options)),
    defaults: (options) => orig.defaults(ext(def, options)),
    makeRe: (pattern, options = {}) => orig.makeRe(pattern, ext(def, options)),
    braceExpand: (pattern, options = {}) => orig.braceExpand(pattern, ext(def, options)),
    match: (list, pattern, options = {}) => orig.match(list, pattern, ext(def, options)),
    sep: orig.sep,
    GLOBSTAR
  });
};
minimatch.defaults = defaults;
var braceExpand = (pattern, options = {}) => {
  assertValidPattern(pattern);
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    return [pattern];
  }
  return (0, import_brace_expansion.default)(pattern);
};
minimatch.braceExpand = braceExpand;
var makeRe = (pattern, options = {}) => new Minimatch(pattern, options).makeRe();
minimatch.makeRe = makeRe;
var match = (list, pattern, options = {}) => {
  const mm = new Minimatch(pattern, options);
  list = list.filter((f) => mm.match(f));
  if (mm.options.nonull && !list.length) {
    list.push(pattern);
  }
  return list;
};
minimatch.match = match;
var globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
var regExpEscape2 = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var Minimatch = class {
  options;
  set;
  pattern;
  windowsPathsNoEscape;
  nonegate;
  negate;
  comment;
  empty;
  preserveMultipleSlashes;
  partial;
  globSet;
  globParts;
  nocase;
  isWindows;
  platform;
  windowsNoMagicRoot;
  maxGlobstarRecursion;
  regexp;
  constructor(pattern, options = {}) {
    assertValidPattern(pattern);
    options = options || {};
    this.options = options;
    this.maxGlobstarRecursion = options.maxGlobstarRecursion ?? 200;
    this.pattern = pattern;
    this.platform = options.platform || defaultPlatform;
    this.isWindows = this.platform === "win32";
    this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options.allowWindowsEscape === false;
    if (this.windowsPathsNoEscape) {
      this.pattern = this.pattern.replace(/\\/g, "/");
    }
    this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
    this.regexp = null;
    this.negate = false;
    this.nonegate = !!options.nonegate;
    this.comment = false;
    this.empty = false;
    this.partial = !!options.partial;
    this.nocase = !!this.options.nocase;
    this.windowsNoMagicRoot = options.windowsNoMagicRoot !== void 0 ? options.windowsNoMagicRoot : !!(this.isWindows && this.nocase);
    this.globSet = [];
    this.globParts = [];
    this.set = [];
    this.make();
  }
  hasMagic() {
    if (this.options.magicalBraces && this.set.length > 1) {
      return true;
    }
    for (const pattern of this.set) {
      for (const part of pattern) {
        if (typeof part !== "string")
          return true;
      }
    }
    return false;
  }
  debug(..._) {
  }
  make() {
    const pattern = this.pattern;
    const options = this.options;
    if (!options.nocomment && pattern.charAt(0) === "#") {
      this.comment = true;
      return;
    }
    if (!pattern) {
      this.empty = true;
      return;
    }
    this.parseNegate();
    this.globSet = [...new Set(this.braceExpand())];
    if (options.debug) {
      this.debug = (...args) => console.error(...args);
    }
    this.debug(this.pattern, this.globSet);
    const rawGlobParts = this.globSet.map((s) => this.slashSplit(s));
    this.globParts = this.preprocess(rawGlobParts);
    this.debug(this.pattern, this.globParts);
    let set = this.globParts.map((s, _, __) => {
      if (this.isWindows && this.windowsNoMagicRoot) {
        const isUNC = s[0] === "" && s[1] === "" && (s[2] === "?" || !globMagic.test(s[2])) && !globMagic.test(s[3]);
        const isDrive = /^[a-z]:/i.test(s[0]);
        if (isUNC) {
          return [...s.slice(0, 4), ...s.slice(4).map((ss) => this.parse(ss))];
        } else if (isDrive) {
          return [s[0], ...s.slice(1).map((ss) => this.parse(ss))];
        }
      }
      return s.map((ss) => this.parse(ss));
    });
    this.debug(this.pattern, set);
    this.set = set.filter((s) => s.indexOf(false) === -1);
    if (this.isWindows) {
      for (let i2 = 0; i2 < this.set.length; i2++) {
        const p = this.set[i2];
        if (p[0] === "" && p[1] === "" && this.globParts[i2][2] === "?" && typeof p[3] === "string" && /^[a-z]:$/i.test(p[3])) {
          p[2] = "?";
        }
      }
    }
    this.debug(this.pattern, this.set);
  }
  // various transforms to equivalent pattern sets that are
  // faster to process in a filesystem walk.  The goal is to
  // eliminate what we can, and push all ** patterns as far
  // to the right as possible, even if it increases the number
  // of patterns that we have to process.
  preprocess(globParts) {
    if (this.options.noglobstar) {
      for (let i2 = 0; i2 < globParts.length; i2++) {
        for (let j = 0; j < globParts[i2].length; j++) {
          if (globParts[i2][j] === "**") {
            globParts[i2][j] = "*";
          }
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      globParts = this.firstPhasePreProcess(globParts);
      globParts = this.secondPhasePreProcess(globParts);
    } else if (optimizationLevel >= 1) {
      globParts = this.levelOneOptimize(globParts);
    } else {
      globParts = this.adjascentGlobstarOptimize(globParts);
    }
    return globParts;
  }
  // just get rid of adjascent ** portions
  adjascentGlobstarOptimize(globParts) {
    return globParts.map((parts) => {
      let gs = -1;
      while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
        let i2 = gs;
        while (parts[i2 + 1] === "**") {
          i2++;
        }
        if (i2 !== gs) {
          parts.splice(gs, i2 - gs);
        }
      }
      return parts;
    });
  }
  // get rid of adjascent ** and resolve .. portions
  levelOneOptimize(globParts) {
    return globParts.map((parts) => {
      parts = parts.reduce((set, part) => {
        const prev = set[set.length - 1];
        if (part === "**" && prev === "**") {
          return set;
        }
        if (part === "..") {
          if (prev && prev !== ".." && prev !== "." && prev !== "**") {
            set.pop();
            return set;
          }
        }
        set.push(part);
        return set;
      }, []);
      return parts.length === 0 ? [""] : parts;
    });
  }
  levelTwoFileOptimize(parts) {
    if (!Array.isArray(parts)) {
      parts = this.slashSplit(parts);
    }
    let didSomething = false;
    do {
      didSomething = false;
      if (!this.preserveMultipleSlashes) {
        for (let i2 = 1; i2 < parts.length - 1; i2++) {
          const p = parts[i2];
          if (i2 === 1 && p === "" && parts[0] === "")
            continue;
          if (p === "." || p === "") {
            didSomething = true;
            parts.splice(i2, 1);
            i2--;
          }
        }
        if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
          didSomething = true;
          parts.pop();
        }
      }
      let dd = 0;
      while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
        const p = parts[dd - 1];
        if (p && p !== "." && p !== ".." && p !== "**") {
          didSomething = true;
          parts.splice(dd - 1, 2);
          dd -= 2;
        }
      }
    } while (didSomething);
    return parts.length === 0 ? [""] : parts;
  }
  // First phase: single-pattern processing
  // <pre> is 1 or more portions
  // <rest> is 1 or more portions
  // <p> is any portion other than ., .., '', or **
  // <e> is . or ''
  //
  // **/.. is *brutal* for filesystem walking performance, because
  // it effectively resets the recursive walk each time it occurs,
  // and ** cannot be reduced out by a .. pattern part like a regexp
  // or most strings (other than .., ., and '') can be.
  //
  // <pre>/**/../<p>/<p>/<rest> -> {<pre>/../<p>/<p>/<rest>,<pre>/**/<p>/<p>/<rest>}
  // <pre>/<e>/<rest> -> <pre>/<rest>
  // <pre>/<p>/../<rest> -> <pre>/<rest>
  // **/**/<rest> -> **/<rest>
  //
  // **/*/<rest> -> */**/<rest> <== not valid because ** doesn't follow
  // this WOULD be allowed if ** did follow symlinks, or * didn't
  firstPhasePreProcess(globParts) {
    let didSomething = false;
    do {
      didSomething = false;
      for (let parts of globParts) {
        let gs = -1;
        while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
          let gss = gs;
          while (parts[gss + 1] === "**") {
            gss++;
          }
          if (gss > gs) {
            parts.splice(gs + 1, gss - gs);
          }
          let next = parts[gs + 1];
          const p = parts[gs + 2];
          const p2 = parts[gs + 3];
          if (next !== "..")
            continue;
          if (!p || p === "." || p === ".." || !p2 || p2 === "." || p2 === "..") {
            continue;
          }
          didSomething = true;
          parts.splice(gs, 1);
          const other = parts.slice(0);
          other[gs] = "**";
          globParts.push(other);
          gs--;
        }
        if (!this.preserveMultipleSlashes) {
          for (let i2 = 1; i2 < parts.length - 1; i2++) {
            const p = parts[i2];
            if (i2 === 1 && p === "" && parts[0] === "")
              continue;
            if (p === "." || p === "") {
              didSomething = true;
              parts.splice(i2, 1);
              i2--;
            }
          }
          if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
            didSomething = true;
            parts.pop();
          }
        }
        let dd = 0;
        while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
          const p = parts[dd - 1];
          if (p && p !== "." && p !== ".." && p !== "**") {
            didSomething = true;
            const needDot = dd === 1 && parts[dd + 1] === "**";
            const splin = needDot ? ["."] : [];
            parts.splice(dd - 1, 2, ...splin);
            if (parts.length === 0)
              parts.push("");
            dd -= 2;
          }
        }
      }
    } while (didSomething);
    return globParts;
  }
  // second phase: multi-pattern dedupes
  // {<pre>/*/<rest>,<pre>/<p>/<rest>} -> <pre>/*/<rest>
  // {<pre>/<rest>,<pre>/<rest>} -> <pre>/<rest>
  // {<pre>/**/<rest>,<pre>/<rest>} -> <pre>/**/<rest>
  //
  // {<pre>/**/<rest>,<pre>/**/<p>/<rest>} -> <pre>/**/<rest>
  // ^-- not valid because ** doens't follow symlinks
  secondPhasePreProcess(globParts) {
    for (let i2 = 0; i2 < globParts.length - 1; i2++) {
      for (let j = i2 + 1; j < globParts.length; j++) {
        const matched = this.partsMatch(globParts[i2], globParts[j], !this.preserveMultipleSlashes);
        if (matched) {
          globParts[i2] = [];
          globParts[j] = matched;
          break;
        }
      }
    }
    return globParts.filter((gs) => gs.length);
  }
  partsMatch(a, b, emptyGSMatch = false) {
    let ai = 0;
    let bi = 0;
    let result = [];
    let which = "";
    while (ai < a.length && bi < b.length) {
      if (a[ai] === b[bi]) {
        result.push(which === "b" ? b[bi] : a[ai]);
        ai++;
        bi++;
      } else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
        result.push(a[ai]);
        ai++;
      } else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
        result.push(b[bi]);
        bi++;
      } else if (a[ai] === "*" && b[bi] && (this.options.dot || !b[bi].startsWith(".")) && b[bi] !== "**") {
        if (which === "b")
          return false;
        which = "a";
        result.push(a[ai]);
        ai++;
        bi++;
      } else if (b[bi] === "*" && a[ai] && (this.options.dot || !a[ai].startsWith(".")) && a[ai] !== "**") {
        if (which === "a")
          return false;
        which = "b";
        result.push(b[bi]);
        ai++;
        bi++;
      } else {
        return false;
      }
    }
    return a.length === b.length && result;
  }
  parseNegate() {
    if (this.nonegate)
      return;
    const pattern = this.pattern;
    let negate = false;
    let negateOffset = 0;
    for (let i2 = 0; i2 < pattern.length && pattern.charAt(i2) === "!"; i2++) {
      negate = !negate;
      negateOffset++;
    }
    if (negateOffset)
      this.pattern = pattern.slice(negateOffset);
    this.negate = negate;
  }
  // set partial to true to test if, for example,
  // "/a/b" matches the start of "/*/b/*/d"
  // Partial means, if you run out of file before you run
  // out of pattern, then that's fine, as long as all
  // the parts match.
  matchOne(file, pattern, partial = false) {
    let fileStartIndex = 0;
    let patternStartIndex = 0;
    if (this.isWindows) {
      const fileDrive = typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
      const fileUNC = !fileDrive && file[0] === "" && file[1] === "" && file[2] === "?" && /^[a-z]:$/i.test(file[3]);
      const patternDrive = typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
      const patternUNC = !patternDrive && pattern[0] === "" && pattern[1] === "" && pattern[2] === "?" && typeof pattern[3] === "string" && /^[a-z]:$/i.test(pattern[3]);
      const fdi = fileUNC ? 3 : fileDrive ? 0 : void 0;
      const pdi = patternUNC ? 3 : patternDrive ? 0 : void 0;
      if (typeof fdi === "number" && typeof pdi === "number") {
        const [fd2, pd] = [
          file[fdi],
          pattern[pdi]
        ];
        if (fd2.toLowerCase() === pd.toLowerCase()) {
          pattern[pdi] = fd2;
          patternStartIndex = pdi;
          fileStartIndex = fdi;
        }
      }
    }
    const { optimizationLevel = 1 } = this.options;
    if (optimizationLevel >= 2) {
      file = this.levelTwoFileOptimize(file);
    }
    if (pattern.includes(GLOBSTAR)) {
      return this.#matchGlobstar(file, pattern, partial, fileStartIndex, patternStartIndex);
    }
    return this.#matchOne(file, pattern, partial, fileStartIndex, patternStartIndex);
  }
  #matchGlobstar(file, pattern, partial, fileIndex, patternIndex) {
    const firstgs = pattern.indexOf(GLOBSTAR, patternIndex);
    const lastgs = pattern.lastIndexOf(GLOBSTAR);
    const [head, body, tail] = partial ? [
      pattern.slice(patternIndex, firstgs),
      pattern.slice(firstgs + 1),
      []
    ] : [
      pattern.slice(patternIndex, firstgs),
      pattern.slice(firstgs + 1, lastgs),
      pattern.slice(lastgs + 1)
    ];
    if (head.length) {
      const fileHead = file.slice(fileIndex, fileIndex + head.length);
      if (!this.#matchOne(fileHead, head, partial, 0, 0))
        return false;
      fileIndex += head.length;
    }
    let fileTailMatch = 0;
    if (tail.length) {
      if (tail.length + fileIndex > file.length)
        return false;
      let tailStart = file.length - tail.length;
      if (this.#matchOne(file, tail, partial, tailStart, 0)) {
        fileTailMatch = tail.length;
      } else {
        if (file[file.length - 1] !== "" || fileIndex + tail.length === file.length) {
          return false;
        }
        tailStart--;
        if (!this.#matchOne(file, tail, partial, tailStart, 0))
          return false;
        fileTailMatch = tail.length + 1;
      }
    }
    if (!body.length) {
      let sawSome = !!fileTailMatch;
      for (let i3 = fileIndex; i3 < file.length - fileTailMatch; i3++) {
        const f = String(file[i3]);
        sawSome = true;
        if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
          return false;
        }
      }
      return partial || sawSome;
    }
    const bodySegments = [[[], 0]];
    let currentBody = bodySegments[0];
    let nonGsParts = 0;
    const nonGsPartsSums = [0];
    for (const b of body) {
      if (b === GLOBSTAR) {
        nonGsPartsSums.push(nonGsParts);
        currentBody = [[], 0];
        bodySegments.push(currentBody);
      } else {
        currentBody[0].push(b);
        nonGsParts++;
      }
    }
    let i2 = bodySegments.length - 1;
    const fileLength = file.length - fileTailMatch;
    for (const b of bodySegments) {
      b[1] = fileLength - (nonGsPartsSums[i2--] + b[0].length);
    }
    return !!this.#matchGlobStarBodySections(file, bodySegments, fileIndex, 0, partial, 0, !!fileTailMatch);
  }
  #matchGlobStarBodySections(file, bodySegments, fileIndex, bodyIndex, partial, globStarDepth, sawTail) {
    const bs = bodySegments[bodyIndex];
    if (!bs) {
      for (let i2 = fileIndex; i2 < file.length; i2++) {
        sawTail = true;
        const f = file[i2];
        if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
          return false;
        }
      }
      return sawTail;
    }
    const [body, after] = bs;
    while (fileIndex <= after) {
      const m = this.#matchOne(file.slice(0, fileIndex + body.length), body, partial, fileIndex, 0);
      if (m && globStarDepth < this.maxGlobstarRecursion) {
        const sub = this.#matchGlobStarBodySections(file, bodySegments, fileIndex + body.length, bodyIndex + 1, partial, globStarDepth + 1, sawTail);
        if (sub !== false)
          return sub;
      }
      const f = file[fileIndex];
      if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) {
        return false;
      }
      fileIndex++;
    }
    return partial || null;
  }
  #matchOne(file, pattern, partial, fileIndex, patternIndex) {
    let fi;
    let pi;
    let pl;
    let fl2;
    for (fi = fileIndex, pi = patternIndex, fl2 = file.length, pl = pattern.length; fi < fl2 && pi < pl; fi++, pi++) {
      this.debug("matchOne loop");
      let p = pattern[pi];
      let f = file[fi];
      this.debug(pattern, p, f);
      if (p === false || p === GLOBSTAR)
        return false;
      let hit;
      if (typeof p === "string") {
        hit = f === p;
        this.debug("string match", p, f, hit);
      } else {
        hit = p.test(f);
        this.debug("pattern match", p, f, hit);
      }
      if (!hit)
        return false;
    }
    if (fi === fl2 && pi === pl) {
      return true;
    } else if (fi === fl2) {
      return partial;
    } else if (pi === pl) {
      return fi === fl2 - 1 && file[fi] === "";
    } else {
      throw new Error("wtf?");
    }
  }
  braceExpand() {
    return braceExpand(this.pattern, this.options);
  }
  parse(pattern) {
    assertValidPattern(pattern);
    const options = this.options;
    if (pattern === "**")
      return GLOBSTAR;
    if (pattern === "")
      return "";
    let m;
    let fastTest = null;
    if (m = pattern.match(starRE)) {
      fastTest = options.dot ? starTestDot : starTest;
    } else if (m = pattern.match(starDotExtRE)) {
      fastTest = (options.nocase ? options.dot ? starDotExtTestNocaseDot : starDotExtTestNocase : options.dot ? starDotExtTestDot : starDotExtTest)(m[1]);
    } else if (m = pattern.match(qmarksRE)) {
      fastTest = (options.nocase ? options.dot ? qmarksTestNocaseDot : qmarksTestNocase : options.dot ? qmarksTestDot : qmarksTest)(m);
    } else if (m = pattern.match(starDotStarRE)) {
      fastTest = options.dot ? starDotStarTestDot : starDotStarTest;
    } else if (m = pattern.match(dotStarRE)) {
      fastTest = dotStarTest;
    }
    const re = AST.fromGlob(pattern, this.options).toMMPattern();
    if (fastTest && typeof re === "object") {
      Reflect.defineProperty(re, "test", { value: fastTest });
    }
    return re;
  }
  makeRe() {
    if (this.regexp || this.regexp === false)
      return this.regexp;
    const set = this.set;
    if (!set.length) {
      this.regexp = false;
      return this.regexp;
    }
    const options = this.options;
    const twoStar = options.noglobstar ? star2 : options.dot ? twoStarDot : twoStarNoDot;
    const flags = new Set(options.nocase ? ["i"] : []);
    let re = set.map((pattern) => {
      const pp = pattern.map((p) => {
        if (p instanceof RegExp) {
          for (const f of p.flags.split(""))
            flags.add(f);
        }
        return typeof p === "string" ? regExpEscape2(p) : p === GLOBSTAR ? GLOBSTAR : p._src;
      });
      pp.forEach((p, i2) => {
        const next = pp[i2 + 1];
        const prev = pp[i2 - 1];
        if (p !== GLOBSTAR || prev === GLOBSTAR) {
          return;
        }
        if (prev === void 0) {
          if (next !== void 0 && next !== GLOBSTAR) {
            pp[i2 + 1] = "(?:\\/|" + twoStar + "\\/)?" + next;
          } else {
            pp[i2] = twoStar;
          }
        } else if (next === void 0) {
          pp[i2 - 1] = prev + "(?:\\/|" + twoStar + ")?";
        } else if (next !== GLOBSTAR) {
          pp[i2 - 1] = prev + "(?:\\/|\\/" + twoStar + "\\/)" + next;
          pp[i2 + 1] = GLOBSTAR;
        }
      });
      return pp.filter((p) => p !== GLOBSTAR).join("/");
    }).join("|");
    const [open4, close] = set.length > 1 ? ["(?:", ")"] : ["", ""];
    re = "^" + open4 + re + close + "$";
    if (this.negate)
      re = "^(?!" + re + ").+$";
    try {
      this.regexp = new RegExp(re, [...flags].join(""));
    } catch (ex) {
      this.regexp = false;
    }
    return this.regexp;
  }
  slashSplit(p) {
    if (this.preserveMultipleSlashes) {
      return p.split("/");
    } else if (this.isWindows && /^\/\/[^\/]+/.test(p)) {
      return ["", ...p.split(/\/+/)];
    } else {
      return p.split(/\/+/);
    }
  }
  match(f, partial = this.partial) {
    this.debug("match", f, this.pattern);
    if (this.comment) {
      return false;
    }
    if (this.empty) {
      return f === "";
    }
    if (f === "/" && partial) {
      return true;
    }
    const options = this.options;
    if (this.isWindows) {
      f = f.split("\\").join("/");
    }
    const ff = this.slashSplit(f);
    this.debug(this.pattern, "split", ff);
    const set = this.set;
    this.debug(this.pattern, "set", set);
    let filename = ff[ff.length - 1];
    if (!filename) {
      for (let i2 = ff.length - 2; !filename && i2 >= 0; i2--) {
        filename = ff[i2];
      }
    }
    for (let i2 = 0; i2 < set.length; i2++) {
      const pattern = set[i2];
      let file = ff;
      if (options.matchBase && pattern.length === 1) {
        file = [filename];
      }
      const hit = this.matchOne(file, pattern, partial);
      if (hit) {
        if (options.flipNegate) {
          return true;
        }
        return !this.negate;
      }
    }
    if (options.flipNegate) {
      return false;
    }
    return this.negate;
  }
  static defaults(def) {
    return minimatch.defaults(def).Minimatch;
  }
};
minimatch.AST = AST;
minimatch.Minimatch = Minimatch;
minimatch.escape = escape;
minimatch.unescape = unescape;

// src/utils/path-match.ts
function normalizeRepoPath(input) {
  const normalized = input.replaceAll("\\", "/").replace(/^\.\/+/, "");
  if (path11.posix.isAbsolute(normalized) || normalized.split("/").includes("..")) {
    throw new Error(`\u8DEF\u5F84\u5FC5\u987B\u4F4D\u4E8E\u4ED3\u5E93\u5185\u90E8\u5E76\u4F7F\u7528\u76F8\u5BF9\u8DEF\u5F84\uFF1A${input}`);
  }
  return path11.posix.normalize(normalized);
}
function matchRepoGlob(input, pattern) {
  const normalizedPath = normalizeRepoPath(input);
  const normalizedPattern = normalizeRepoPath(pattern);
  return minimatch(normalizedPath, normalizedPattern, {
    dot: true,
    matchBase: !normalizedPattern.includes("/")
  });
}

// src/core/schema-validator.ts
import path12 from "node:path";
import { fileURLToPath } from "node:url";
import { readFile as readFile5 } from "node:fs/promises";
function valueType(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}
function validateNode(value, schema, location, errors) {
  if ("const" in schema && value !== schema.const) {
    errors.push(`${location} \u5FC5\u987B\u7B49\u4E8E ${JSON.stringify(schema.const)}\u3002`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => item === value)) {
    errors.push(`${location} \u4E0D\u5728\u5141\u8BB8\u503C\u8303\u56F4\u5185\u3002`);
  }
  if (typeof schema.type === "string" && (schema.type === "integer" ? typeof value !== "number" || !Number.isInteger(value) : valueType(value) !== schema.type)) {
    errors.push(`${location} \u5FC5\u987B\u662F ${schema.type}\u3002`);
    return;
  }
  if (typeof value === "number" && typeof schema.minimum === "number" && value < schema.minimum) {
    errors.push(`${location} \u4E0D\u80FD\u5C0F\u4E8E ${schema.minimum}\u3002`);
  }
  if (typeof value === "number" && typeof schema.maximum === "number" && value > schema.maximum) {
    errors.push(`${location} \u4E0D\u80FD\u5927\u4E8E ${schema.maximum}\u3002`);
  }
  if (typeof value === "string" && typeof schema.minLength === "number" && value.length < schema.minLength) {
    errors.push(`${location} \u957F\u5EA6\u4E0D\u80FD\u5C0F\u4E8E ${schema.minLength}\u3002`);
  }
  if (schema.type === "object" && value && typeof value === "object") {
    const record = value;
    const required = Array.isArray(schema.required) ? schema.required.map(String) : [];
    for (const key of required) {
      if (!(key in record)) errors.push(`${location}.${key} \u662F\u5FC5\u586B\u5B57\u6BB5\u3002`);
    }
    const properties = schema.properties && typeof schema.properties === "object" ? schema.properties : {};
    for (const [key, child] of Object.entries(properties)) {
      if (key in record) validateNode(record[key], child, `${location}.${key}`, errors);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(record)) {
        if (!(key in properties)) errors.push(`${location}.${key} \u662F\u672A\u77E5\u5B57\u6BB5\u3002`);
      }
    } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      for (const [key, childValue] of Object.entries(record)) {
        if (key in properties) continue;
        validateNode(
          childValue,
          schema.additionalProperties,
          `${location}.${key}`,
          errors
        );
      }
    }
  }
  if (schema.type === "array" && Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errors.push(`${location} \u81F3\u5C11\u9700\u8981 ${schema.minItems} \u9879\u3002`);
    }
    if (schema.uniqueItems === true && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      errors.push(`${location} \u4E0D\u80FD\u5305\u542B\u91CD\u590D\u9879\u3002`);
    }
    if (schema.items && typeof schema.items === "object") {
      value.forEach(
        (item, index) => validateNode(
          item,
          schema.items,
          `${location}[${index}]`,
          errors
        )
      );
    }
  }
}
async function schemaPath(root, schemaName) {
  const bundleDirectory = path12.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path12.join(bundleDirectory, "schemas", schemaName),
    path12.join(bundleDirectory, "..", "schemas", schemaName),
    path12.join(root, "repo-agent", "schemas", schemaName),
    path12.join(root, "schemas", schemaName)
  ];
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  throw new CliError(
    "E_CONFIG_SCHEMA",
    `\u7F3A\u5C11\u8FD0\u884C\u65F6 Schema\uFF1A${schemaName}`
  );
}
async function validateWithSchema(root, schemaName, value) {
  const file = await schemaPath(root, schemaName);
  const schema = JSON.parse(await readFile5(file, "utf8"));
  const errors = [];
  validateNode(value, schema, "$", errors);
  if (errors.length) {
    throw new CliError("E_CONFIG_SCHEMA", errors.join(" "), schemaName);
  }
}

// src/commands/validate.ts
async function validateProject(root, strict = false) {
  const errors = [];
  const warnings = [];
  const assetRoot = await resolveAssetRoot(root);
  const agentRoot = assetRoot.path;
  const asset = (...segments) => relativeAssetPath(assetRoot, ...segments);
  const requiredDirectories = [
    asset("policies"),
    asset("memories"),
    asset("skills", "approved"),
    asset("fix_patterns", "approved")
  ];
  if (!await exists(agentRoot)) {
    return {
      ok: false,
      command: "validate",
      mode: strict ? "strict" : "normal",
      errors: [{
        code: "E_PROJECT_NOT_INITIALIZED",
        path: assetRoot.name,
        message: "\u9879\u76EE\u5C1A\u672A\u521D\u59CB\u5316\u3002"
      }],
      warnings
    };
  }
  const requiredFiles = [
    asset("config.yaml"),
    asset("commit_policy.yaml"),
    asset("lock.yaml"),
    asset("policies", "protected_files.yaml"),
    asset("policies", "command_policy.yaml"),
    asset("policies", "permissions.yaml"),
    asset("hooks", "routes.yaml"),
    asset("tools", "registry.yaml"),
    asset("tools", "permissions.yaml")
  ];
  for (const relativePath of requiredFiles) {
    const file = path13.join(root, relativePath);
    if (!await exists(file)) {
      errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "\u7F3A\u5C11\u5FC5\u9700\u6587\u4EF6\u3002" });
      continue;
    }
    try {
      const value = await readYaml(file);
      const schemaName = relativePath === asset("config.yaml") ? "config.schema.json" : relativePath === asset("commit_policy.yaml") ? "commit_policy.schema.json" : relativePath.endsWith("hooks/routes.yaml") ? "hook_routes.schema.json" : relativePath.includes("/policies/") ? "policy.schema.json" : void 0;
      if (schemaName) await validateWithSchema(root, schemaName, value);
      const validVersion = value?.version === 1;
      if (!value || !validVersion) {
        errors.push({
          code: "E_CONFIG_SCHEMA",
          path: relativePath,
          message: "version \u5FC5\u987B\u4E3A 1\u3002"
        });
      }
      if (relativePath === asset("config.yaml") && (value.mode !== "team" && value.mode !== "personal")) {
        errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "mode \u53EA\u80FD\u662F team \u6216 personal\u3002" });
      }
      if (relativePath === asset("config.yaml")) {
        const network = value.network;
        const networkModes = ["offline", "internal_only", "explicit_allow", "unrestricted"];
        if (!networkModes.includes(String(network?.mode ?? ""))) {
          errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "network.mode \u65E0\u6548\u3002" });
        }
        const audit = value.audit;
        if (typeof audit?.write_to !== "string") {
          errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "\u7F3A\u5C11 audit.write_to\u3002" });
        } else {
          try {
            normalizeRepoPath(audit.write_to);
          } catch {
            errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "audit.write_to \u5FC5\u987B\u4F4D\u4E8E\u4ED3\u5E93\u5185\u90E8\u3002" });
          }
        }
      }
      if (relativePath === asset("commit_policy.yaml") && (value.default_mode !== "ask" && value.default_mode !== "keep_local")) {
        errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "default_mode \u65E0\u6548\u3002" });
      }
      if (relativePath.endsWith("protected_files.yaml") && !Array.isArray(value.protected_files)) {
        errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "protected_files \u5FC5\u987B\u662F\u6570\u7EC4\u3002" });
      }
      if (relativePath.endsWith("command_policy.yaml") && !Array.isArray(value.dangerous_commands)) {
        errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "dangerous_commands \u5FC5\u987B\u662F\u6570\u7EC4\u3002" });
      }
      if (relativePath.endsWith("hooks/routes.yaml")) {
        validateHookRoutesConfig(value);
      }
      if (relativePath.endsWith("tools/registry.yaml")) {
        const tools = value.tools;
        if (!Array.isArray(tools)) {
          errors.push({
            code: "E_TOOL_REGISTRY",
            path: relativePath,
            message: "tools \u5FC5\u987B\u662F\u6570\u7EC4\u3002"
          });
        } else {
          const seen = /* @__PURE__ */ new Set();
          for (const entry of tools) {
            const tool2 = entry && typeof entry === "object" ? entry : {};
            const id = typeof tool2.id === "string" ? tool2.id : "";
            if (!id) {
              errors.push({
                code: "E_TOOL_REGISTRY",
                path: relativePath,
                message: "\u5DE5\u5177\u6CE8\u518C\u9879\u5FC5\u987B\u5305\u542B\u975E\u7A7A id\u3002"
              });
              continue;
            }
            if (seen.has(id)) {
              errors.push({
                code: "E_TOOL_REGISTRY",
                path: relativePath,
                message: `\u5DE5\u5177 id \u91CD\u590D\uFF1A${id}\u3002`
              });
            }
            seen.add(id);
            if (isRepoAgentHookToolId(id) && !getRepoAgentToolByHookId(id)) {
              errors.push({
                code: "E_TOOL_MANIFEST_DRIFT",
                path: relativePath,
                message: `repo-agent \u5DE5\u5177\u672A\u5728 Tool Manifest \u4E2D\u58F0\u660E\uFF1A${id}\u3002`
              });
            }
          }
        }
      }
      if (relativePath.endsWith("tools/permissions.yaml") && (!Array.isArray(value.blocked) || !Array.isArray(value.requires_confirmation))) {
        errors.push({
          code: "E_TOOL_PERMISSIONS",
          path: relativePath,
          message: "blocked \u548C requires_confirmation \u5FC5\u987B\u662F\u6570\u7EC4\u3002"
        });
      }
    } catch (error) {
      errors.push({
        code: error instanceof CliError ? error.code : "E_CONFIG_PARSE",
        path: relativePath,
        message: error.message
      });
    }
  }
  for (const relativePath of requiredDirectories) {
    if (!await exists(path13.join(root, relativePath))) {
      errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "\u7F3A\u5C11\u5FC5\u9700\u76EE\u5F55\u3002" });
    }
  }
  const policyFiles = (await listFiles(path13.join(agentRoot, "policies"))).filter(
    (file) => /\.ya?ml$/i.test(file)
  );
  if (!policyFiles.length) {
    warnings.push({ code: "W_NO_POLICIES", path: asset("policies"), message: "\u672A\u627E\u5230\u7B56\u7565\u6587\u4EF6\u3002" });
  }
  const candidateDirectories = [
    path13.join(root, asset("memory_candidates")),
    path13.join(root, asset("skills", "candidates")),
    path13.join(root, asset("fix_patterns", "candidates")),
    privateAssetPath(root, "memory_candidates"),
    privateAssetPath(root, "skills", "candidates"),
    privateAssetPath(root, "fix_patterns", "candidates")
  ];
  const allowedStatuses = /* @__PURE__ */ new Set([
    "candidate",
    "validated",
    "team_proposed",
    "approved",
    "rejected",
    "quarantined",
    "superseded",
    "merged",
    "stale",
    "archived"
  ]);
  for (const directory of candidateDirectories) {
    const files = (await listFiles(directory)).filter((file) => /\.ya?ml$/i.test(file));
    for (const file of files) {
      const relativePath = path13.relative(root, file).replaceAll("\\", "/");
      try {
        if (strict && containsPossibleSecret(await readFile6(file, "utf8"))) {
          errors.push({ code: "E_SECRET_DETECTED", path: relativePath, message: "\u5019\u9009\u5185\u5BB9\u53EF\u80FD\u5305\u542B\u654F\u611F\u4FE1\u606F\u3002" });
        }
        const candidate = await readYaml(file);
        const candidateSchema = candidate.type === "memory" ? "memory_candidate.schema.json" : candidate.type === "skill" ? "skill_candidate.schema.json" : candidate.type === "fix_pattern" ? "fix_pattern_candidate.schema.json" : void 0;
        if (candidateSchema) {
          await validateWithSchema(root, candidateSchema, candidate);
        }
        const required = ["id", "candidate_id", "status", "evidence", "review", "score", "proposed_by", "created_at"];
        const missing = required.filter((key) => candidate[key] === void 0);
        const type = String(candidate.type ?? "");
        if (type === "memory" && typeof candidate.content !== "string" || type === "skill" && (typeof candidate.description !== "string" || !Array.isArray(candidate.steps)) || type === "fix_pattern" && (typeof candidate.pattern !== "string" || typeof candidate.recommendation !== "string") || !["memory", "skill", "fix_pattern"].includes(type)) {
          missing.push("\u7C7B\u578B\u5BF9\u5E94\u7684\u5185\u5BB9\u5B57\u6BB5");
        }
        if (!candidate.evidence || typeof candidate.evidence !== "object" || !candidate.review || typeof candidate.review !== "object" || !candidate.score || typeof candidate.score !== "object") {
          missing.push("\u7ED3\u6784\u5316 evidence/review/score");
        }
        if (missing.length || !allowedStatuses.has(String(candidate.status))) {
          errors.push({
            code: "E_INVALID_CANDIDATE",
            path: relativePath,
            message: missing.length ? `\u7F3A\u5C11\u5FC5\u9700\u5B57\u6BB5\uFF1A${missing.join("\u3001")}\u3002` : `\u5019\u9009\u72B6\u6001\u65E0\u6548\uFF1A${String(candidate.status)}\u3002`
          });
        }
      } catch (error) {
        errors.push({
          code: error instanceof CliError ? error.code : "E_CONFIG_PARSE",
          path: relativePath,
          message: error.message
        });
      }
    }
  }
  if (strict) {
    const formalConfigFiles = [
      asset("config.yaml"),
      asset("commit_policy.yaml"),
      asset("lock.yaml"),
      ...(await listFiles(path13.join(assetRoot.path, "policies"))).map(
        (file) => path13.relative(root, file).replaceAll("\\", "/")
      )
    ];
    for (const relativePath of formalConfigFiles) {
      const file = path13.join(root, relativePath);
      if (await exists(file) && containsPossibleSecret(await readFile6(file, "utf8"))) {
        errors.push({
          code: "E_SECRET_DETECTED",
          path: relativePath,
          message: "\u6B63\u5F0F\u914D\u7F6E\u53EF\u80FD\u5305\u542B\u654F\u611F\u4FE1\u606F\u3002"
        });
      }
    }
    const artifactDirectories = [
      path13.join(root, asset("skills", "approved")),
      path13.join(root, asset("fix_patterns", "approved"))
    ];
    const seenIds = /* @__PURE__ */ new Map();
    const seenCandidateFingerprints = /* @__PURE__ */ new Map();
    const indexedFiles = [
      ...(await Promise.all(
        [...candidateDirectories, ...artifactDirectories].map(
          (directory) => listFiles(directory)
        )
      )).flat()
    ].filter((file) => /\.ya?ml$/i.test(file) && !file.endsWith("error_aliases.yaml"));
    for (const file of indexedFiles) {
      const relativePath = path13.relative(root, file).replaceAll("\\", "/");
      try {
        const raw = await readFile6(file, "utf8");
        if (containsPossibleSecret(raw)) {
          errors.push({ code: "E_SECRET_DETECTED", path: relativePath, message: "\u5DF2\u6279\u51C6\u8D44\u4EA7\u6216\u5019\u9009\u8D44\u4EA7\u53EF\u80FD\u5305\u542B\u654F\u611F\u4FE1\u606F\u3002" });
        }
        const artifact = await readYaml(file);
        const id = typeof artifact.id === "string" ? artifact.id : void 0;
        const assetClass = relativePath.includes("/candidates/") || relativePath.includes("/memory_candidates/") ? "candidate" : "approved";
        if (!id) {
          errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "\u8D44\u4EA7\u5FC5\u987B\u5305\u542B id\u3002" });
        } else if (seenIds.get(id)?.[assetClass] && !(assetClass === "candidate" && typeof artifact.fingerprint === "string" && seenCandidateFingerprints.get(id) === artifact.fingerprint)) {
          errors.push({
            code: "E_DUPLICATE_CANDIDATE",
            path: relativePath,
            message: `\u540C\u7C7B\u8D44\u4EA7 id ${id} \u91CD\u590D\uFF1B\u9996\u6B21\u51FA\u73B0\u4E8E ${seenIds.get(id)?.[assetClass]}\u3002`
          });
        } else {
          seenIds.set(id, { ...seenIds.get(id) ?? {}, [assetClass]: relativePath });
          if (assetClass === "candidate" && typeof artifact.fingerprint === "string") {
            seenCandidateFingerprints.set(id, artifact.fingerprint);
          }
        }
        if (relativePath.includes("/skills/approved/")) {
          await validateWithSchema(root, "skill.schema.json", artifact);
          if (artifact.status !== "approved" || !Array.isArray(artifact.steps) || artifact.steps.length === 0) {
            errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "\u5DF2\u6279\u51C6 skill \u5FC5\u987B\u6EE1\u8DB3 status=approved \u4E14 steps \u975E\u7A7A\u3002" });
          }
        }
        if (relativePath.includes("/fix_patterns/approved/")) {
          await validateWithSchema(root, "fix_pattern.schema.json", artifact);
          if (artifact.status !== "approved" || !Array.isArray(artifact.patterns) || !Array.isArray(artifact.guidance) || artifact.patterns.length === 0 || artifact.guidance.length === 0) {
            errors.push({ code: "E_CONFIG_SCHEMA", path: relativePath, message: "\u5DF2\u6279\u51C6 fix pattern \u5FC5\u987B\u5305\u542B status=approved\u3001patterns \u548C guidance\u3002" });
          }
        }
      } catch (error) {
        errors.push({
          code: error instanceof CliError ? error.code : "E_CONFIG_PARSE",
          path: relativePath,
          message: error.message
        });
      }
    }
    for (const file of await listFiles(path13.join(assetRoot.path, "memories"))) {
      if (!/\.md$/i.test(file)) continue;
      const relativePath = path13.relative(root, file).replaceAll("\\", "/");
      if (containsPossibleSecret(await readFile6(file, "utf8"))) {
        errors.push({ code: "E_SECRET_DETECTED", path: relativePath, message: "\u5DF2\u6279\u51C6 memory \u53EF\u80FD\u5305\u542B\u654F\u611F\u4FE1\u606F\u3002" });
      }
    }
    const aliasesPath = path13.join(assetRoot.path, "fix_patterns", "error_aliases.yaml");
    if (await exists(aliasesPath)) {
      try {
        const aliases = await readYaml(aliasesPath);
        if (aliases.version !== 1 || !aliases.aliases || typeof aliases.aliases !== "object") {
          errors.push({ code: "E_CONFIG_SCHEMA", path: asset("fix_patterns", "error_aliases.yaml"), message: "\u9519\u8BEF\u522B\u540D\u914D\u7F6E\u5FC5\u987B\u5305\u542B version=1 \u548C aliases \u6620\u5C04\u3002" });
        }
      } catch (error) {
        errors.push({ code: "E_CONFIG_PARSE", path: asset("fix_patterns", "error_aliases.yaml"), message: error.message });
      }
    }
    const tombstonedIds = /* @__PURE__ */ new Set();
    for (const file of await listFiles(path13.join(assetRoot.path, "tombstones"))) {
      if (!/\.ya?ml$/i.test(file)) continue;
      try {
        const value = await readYaml(file);
        if (typeof value.asset_id === "string") tombstonedIds.add(value.asset_id);
      } catch (error) {
        errors.push({
          code: "E_CONFIG_PARSE",
          path: path13.relative(root, file).replaceAll("\\", "/"),
          message: error.message
        });
      }
    }
    for (const id of tombstonedIds) {
      if (seenIds.get(id)?.approved) {
        errors.push({
          code: "E_UPGRADE_CONFLICT",
          path: seenIds.get(id)?.approved,
          message: `\u8D44\u4EA7 ${id} \u5DF2\u6709 Tombstone\uFF0C\u7981\u6B62\u65E7\u5206\u652F\u91CD\u65B0\u5F15\u5165\u3002`
        });
      }
    }
    const localPath = await resolveLocalConfigPath(root);
    const localRelativePath = path13.relative(root, localPath).replaceAll("\\", "/");
    if (await exists(localPath)) {
      try {
        const local = await readYaml(localPath);
        const conflicts = localPolicyConflicts(local);
        if (conflicts.length) {
          errors.push({
            code: "E_LOCAL_CONFIG_RELAXES_POLICY",
            path: localRelativePath,
            message: conflicts.map((conflict) => conflict.reason).join(" ")
          });
        }
      } catch (error) {
        errors.push({ code: "E_CONFIG_PARSE", path: localRelativePath, message: error.message });
      }
    }
  }
  return {
    ok: errors.length === 0,
    command: "validate",
    mode: strict ? "strict" : "normal",
    errors,
    warnings
  };
}

// src/commands/status.ts
import path24 from "node:path";

// src/core/capability-detector.ts
import path14 from "node:path";
import { execFile as execFile3 } from "node:child_process";
import { promisify as promisify3 } from "node:util";
var execFileAsync3 = promisify3(execFile3);
async function detectCapabilities(root) {
  const profile = await scanProject(root);
  let git = false;
  if (await exists(path14.join(root, ".git"))) {
    try {
      await execFileAsync3("git", ["status", "--short"], { cwd: root });
      git = true;
    } catch {
      git = false;
    }
  }
  return {
    git,
    writeAccess: await isWritable(root),
    testCommands: Boolean(profile.testCommands.unit),
    packageManager: Boolean(profile.packageManager),
    openspec: profile.process.hasOpenSpec,
    adr: profile.process.hasAdr,
    node: Number.parseInt(process.versions.node.split(".")[0], 10) >= 18,
    mcpCompatible: await exists(path14.join(root, ".codex", "config.toml")) || await exists(path14.join(root, ".mcp.json")) || await exists(path14.join(root, "opencode.json"))
  };
}

// src/utils/git.ts
import { execFile as execFile4 } from "node:child_process";
import { promisify as promisify4 } from "node:util";
var execFileAsync4 = promisify4(execFile4);
async function getChangedFiles(root) {
  try {
    const { stdout: stdout2 } = await execFileAsync4(
      "git",
      ["-c", "core.quotepath=false", "status", "--porcelain=v1", "-uall"],
      { cwd: root }
    );
    return stdout2.split("\n").filter(Boolean).map((line) => line.slice(3)).map((file) => file.includes(" -> ") ? file.split(" -> ").at(-1) : file).map((file) => file.replace(/^"|"$/g, "").replaceAll("\\", "/")).filter(
      (file) => !file.startsWith(".repo-agent/generated/") && !file.startsWith(".repo-agent/catalog/")
    );
  } catch {
    return [];
  }
}
async function getGitCommit(root) {
  try {
    const { stdout: stdout2 } = await execFileAsync4("git", ["rev-parse", "HEAD"], {
      cwd: root
    });
    return stdout2.trim() || null;
  } catch {
    return null;
  }
}

// src/core/catalog-builder.ts
import path17 from "node:path";
import { mkdir as mkdir4, writeFile as writeFile5 } from "node:fs/promises";

// src/core/asset-reader.ts
import path16 from "node:path";
import { readFile as readFile8 } from "node:fs/promises";

// src/core/candidate-manager.ts
import path15 from "node:path";
import { createHash } from "node:crypto";
import { readFile as readFile7, writeFile as writeFile4 } from "node:fs/promises";
var locations = {
  memory: "memory_candidates",
  skill: "skills/candidates",
  fix_pattern: "fix_patterns/candidates"
};
var prefixes = {
  memory: "memory.",
  skill: "skill.",
  fix_pattern: "fix."
};
function validateId(kind, id) {
  const expression = /^(memory|skill|fix)\.[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
  if (!expression.test(id) || !id.startsWith(prefixes[kind])) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      `${kind} id \u65E0\u6548\uFF0C\u8BF7\u4F7F\u7528 ${prefixes[kind]}<scope>.<short-slug> \u683C\u5F0F\u3002`
    );
  }
}
function dateParts() {
  const now = /* @__PURE__ */ new Date();
  return {
    iso: now.toISOString(),
    compact: now.toISOString().slice(0, 10).replaceAll("-", ""),
    time: now.toISOString().slice(11, 19).replaceAll(":", "")
  };
}
function candidateFingerprint(kind, id, value) {
  return createHash("sha256").update(`${kind}
${id}
${value.toLowerCase().replace(/\s+/g, " ").trim()}`).digest("hex");
}
function containsPromptInjection(value) {
  return /(忽略|绕过|覆盖).{0,12}(policy|规则|指令|system)|读取.{0,12}(密钥|token|secret)|ignore.{0,12}(previous|system)|reveal.{0,12}(secret|token)/iu.test(
    value
  );
}
async function approvedTarget(root, kind, id) {
  const assetRoot = await resolveAssetRoot(root);
  const slug = id.split(".").slice(1).join(".");
  const relativePath = kind === "memory" ? relativeAssetPath(assetRoot, "memories", `${slug}.md`) : kind === "skill" ? relativeAssetPath(assetRoot, "skills", "approved", `${slug}.yaml`) : relativeAssetPath(
    assetRoot,
    "fix_patterns",
    "approved",
    `${slug}.yaml`
  );
  const target = path15.join(root, relativePath);
  return {
    relativePath,
    ...await exists(target) ? {
      sha256: createHash("sha256").update(await readFile7(target)).digest("hex")
    } : {}
  };
}
async function listCandidates(root, kind) {
  const assetRoot = await resolveAssetRoot(root);
  const roots = [
    {
      directory: path15.join(assetRoot.path, locations[kind]),
      visibility: "team"
    },
    {
      directory: privateAssetPath(root, locations[kind]),
      visibility: "private"
    },
    {
      directory: privateAssetPath(root, "quarantine", locations[kind]),
      visibility: "private"
    }
  ];
  const files = (await Promise.all(roots.map(
    async ({ directory, visibility }) => (await listFiles(directory)).filter((file) => /\.ya?ml$/i.test(file)).map((file) => ({ file, visibility }))
  ))).flat();
  return Promise.all(
    files.map(async ({ file, visibility }) => ({
      source: path15.relative(root, file).replaceAll("\\", "/"),
      visibility,
      candidate: await readYaml(file)
    }))
  );
}
async function listApproved(root, kind) {
  const assetRoot = await resolveAssetRoot(root);
  const relativeDirectory = kind === "skill" ? "skills/approved" : "fix_patterns/approved";
  const files = (await listFiles(path15.join(assetRoot.path, relativeDirectory))).filter(
    (file) => /\.ya?ml$/i.test(file)
  );
  return Promise.all(
    files.map(async (file) => ({
      source: path15.relative(root, file).replaceAll("\\", "/"),
      artifact: await readYaml(file)
    }))
  );
}
async function detectDuplicateCandidates(root) {
  const all = (await Promise.all(
    ["memory", "skill", "fix_pattern"].map(
      (kind) => listCandidates(root, kind)
    )
  )).flat();
  const grouped = /* @__PURE__ */ new Map();
  for (const { source, candidate } of all) {
    const id = String(candidate.id ?? "");
    if (!id) continue;
    grouped.set(id, [
      ...grouped.get(id) ?? [],
      { source, fingerprint: String(candidate.fingerprint ?? "") }
    ]);
  }
  return [...grouped.entries()].filter(
    ([, items]) => items.length > 1 && new Set(items.map((item) => item.fingerprint)).size > 1
  ).map(([id, items]) => ({ id, sources: items.map((item) => item.source) }));
}
async function proposeCandidate(options) {
  validateId(options.kind, options.id);
  if (!options.value.trim()) {
    throw new CliError("E_INVALID_CANDIDATE", "\u5019\u9009\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A\u3002");
  }
  if (containsPossibleSecret(options.value)) {
    throw new CliError(
      "E_SECRET_DETECTED",
      "\u5019\u9009\u5185\u5BB9\u53EF\u80FD\u5305\u542B\u654F\u611F\u4FE1\u606F\uFF0C\u8BF7\u79FB\u9664\u540E\u91CD\u8BD5\u3002"
    );
  }
  const quarantined = containsPromptInjection(options.value);
  const existing = await listCandidates(options.root, options.kind);
  const requestedVisibility = options.visibility ?? "private";
  if (existing.some(
    ({ candidate: candidate2, visibility: visibility2 }) => visibility2 === requestedVisibility && candidate2.id === options.id && ["candidate", "validated", "team_proposed"].includes(String(candidate2.status))
  )) {
    throw new CliError("E_DUPLICATE_CANDIDATE", `${options.id} \u7684\u5019\u9009\u5DF2\u7ECF\u5B58\u5728\u3002`);
  }
  const date = dateParts();
  const assetRoot = await resolveAssetRoot(options.root);
  const visibility = quarantined ? "private" : requestedVisibility;
  const kindLabel = options.kind === "fix_pattern" ? "fix" : options.kind;
  const fingerprint = candidateFingerprint(
    options.kind,
    options.id,
    options.value
  );
  const filename = `cand_${kindLabel}_${fingerprint.slice(0, 24)}.yaml`;
  const target = quarantined ? privateAssetPath(
    options.root,
    "quarantine",
    locations[options.kind],
    filename
  ) : visibility === "team" ? path15.join(assetRoot.path, locations[options.kind], filename) : privateAssetPath(options.root, locations[options.kind], filename);
  const relativePath = path15.relative(options.root, target).replaceAll("\\", "/");
  const candidateId = `candidate.${kindLabel}.${fingerprint.slice(0, 24)}`;
  const baseRevision = await approvedTarget(
    options.root,
    options.kind,
    options.id
  );
  const common = {
    id: options.id,
    candidate_id: candidateId,
    status: quarantined ? "quarantined" : requestedVisibility === "team" ? "team_proposed" : "candidate",
    trusted: false,
    type: options.kind,
    scope: options.scope ?? [],
    base_revision: {
      path: baseRevision.relativePath,
      sha256: baseRevision.sha256 ?? null
    }
  };
  const specific = options.kind === "memory" ? { content: options.value } : options.kind === "skill" ? { description: options.value, steps: [options.value] } : {
    pattern: options.value,
    recommendation: "\u5BA1\u6838\u9519\u8BEF\u4E0A\u4E0B\u6587\uFF0C\u5E76\u8865\u5145\u56DE\u5F52\u6D4B\u8BD5\u3002",
    ...options.recurrence ? { recurrence: options.recurrence } : {}
  };
  const candidate = {
    ...common,
    fingerprint,
    ...quarantined ? { quarantine_reason: "\u68C0\u6D4B\u5230\u63D0\u793A\u6CE8\u5165\u6216\u7ED5\u8FC7\u6CBB\u7406\u7B56\u7565\u7684\u6307\u4EE4\u6027\u6587\u672C\u3002" } : {},
    ...specific,
    evidence: {
      task: options.task ?? "",
      source: "agent",
      changed_files: [],
      tests: [],
      audit: "",
      review_request: null
    },
    review: {
      required: true,
      reviewers: ["codeowners"],
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      merged_into: null,
      review_request: null
    },
    score: {
      confidence: 0.5,
      usefulness: 0.5,
      freshness: 1,
      recurrence: 0,
      success_rate: 0,
      final_weight: 0.3
    },
    proposed_by: options.proposedBy ?? "agent",
    created_at: date.iso
  };
  if (!options.dryRun) {
    if (await exists(path15.join(options.root, relativePath))) {
      throw new CliError("E_DUPLICATE_CANDIDATE", `\u5019\u9009\u8DEF\u5F84\u5DF2\u7ECF\u5B58\u5728\uFF1A${relativePath}`);
    }
    await writeFileExclusive(path15.join(options.root, relativePath), stringifyYaml(candidate));
  }
  return {
    kind: options.kind,
    visibility,
    dryRun: Boolean(options.dryRun),
    path: relativePath,
    candidate
  };
}
async function promoteCandidate(options) {
  const all = (await Promise.all(
    ["memory", "skill", "fix_pattern"].map(
      (kind) => listCandidates(options.root, kind).then(
        (items) => items.map((item) => ({ ...item, kind }))
      )
    )
  )).flat();
  const match2 = all.find(
    ({ visibility, candidate }) => visibility === "private" && (candidate.candidate_id === options.id || candidate.id === options.id)
  );
  if (!match2) {
    throw new CliError("E_INVALID_CANDIDATE", `\u672A\u627E\u5230\u79C1\u4EBA\u5019\u9009\uFF1A${options.id}`);
  }
  const evidence = match2.candidate.evidence && typeof match2.candidate.evidence === "object" ? match2.candidate.evidence : {};
  const occurrences = Number(evidence.occurrences ?? 0);
  const distinctPreflights = Array.isArray(evidence.preflight_ids) ? new Set(evidence.preflight_ids.map(String)).size : occurrences;
  const dates = Array.isArray(evidence.observed_dates) ? new Set(evidence.observed_dates.map(String)).size : 0;
  if (distinctPreflights < 3 || dates < 2) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "\u5019\u9009\u5C1A\u672A\u8FBE\u5230\u664B\u5347\u6761\u4EF6\uFF1A\u9700\u8981 3 \u4E2A\u4E0D\u540C Preflight \u4E14\u8986\u76D6 2 \u4E2A\u65E5\u671F\u3002"
    );
  }
  const assetRoot = await resolveAssetRoot(options.root);
  const fingerprint = String(match2.candidate.fingerprint ?? createHash("sha256").update(String(match2.candidate.id)).digest("hex"));
  const target = path15.join(
    assetRoot.path,
    locations[match2.kind],
    `cand_${match2.kind === "fix_pattern" ? "fix" : match2.kind}_${fingerprint.slice(0, 24)}.yaml`
  );
  const relative = path15.relative(options.root, target).replaceAll("\\", "/");
  const promoted = {
    ...match2.candidate,
    status: "team_proposed",
    trusted: false,
    promoted_from: match2.source,
    promoted_by: options.reviewer ?? "manual-promotion",
    promoted_at: (/* @__PURE__ */ new Date()).toISOString(),
    single_author: true
  };
  if (!options.dryRun) {
    if (await exists(target)) {
      const current = await readYaml(target);
      if (current.fingerprint !== match2.candidate.fingerprint) {
        throw new CliError("E_UPGRADE_CONFLICT", `\u56E2\u961F\u5019\u9009\u5185\u5BB9\u51B2\u7A81\uFF1A${relative}`);
      }
    } else {
      await writeFileExclusive(target, stringifyYaml(promoted));
    }
  }
  return { command: "candidate-promote", dryRun: Boolean(options.dryRun), path: relative, candidate: promoted };
}
async function reviewCandidate(options) {
  const matches = (await listCandidates(options.root, options.kind)).filter(
    ({ candidate }) => candidate.candidate_id === options.id || candidate.id === options.id
  );
  if (matches.length === 0) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      `\u672A\u627E\u5230\u5019\u9009\u8D44\u4EA7\uFF1A${options.id}`
    );
  }
  if (matches.length > 1) {
    throw new CliError(
      "E_UPGRADE_CONFLICT",
      `\u5019\u9009\u6807\u8BC6\u4E0D\u552F\u4E00\uFF0C\u8BF7\u4F7F\u7528 candidate_id\uFF1A${options.id}`
    );
  }
  if (options.action === "merge" && !options.mergedInto) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "merge \u64CD\u4F5C\u5FC5\u987B\u63D0\u4F9B --merged-into\u3002"
    );
  }
  const match2 = matches[0];
  if (options.action === "approve" && match2.visibility === "private") {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "\u79C1\u4EBA Candidate \u4E0D\u5141\u8BB8\u76F4\u63A5\u6279\u51C6\uFF0C\u8BF7\u5148\u6267\u884C candidate promote\u3002"
    );
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const reviewer = options.reviewer ?? "manual-review";
  const gitCommit = await getGitCommit(options.root);
  if (options.action === "approve" && String(match2.candidate.proposed_by ?? "") === reviewer) {
    throw new CliError("E_INVALID_CANDIDATE", "\u56E2\u961F Candidate \u5FC5\u987B\u7531\u975E\u751F\u6210\u8005\u5BA1\u6838\u3002");
  }
  const review = match2.candidate.review && typeof match2.candidate.review === "object" ? match2.candidate.review : {};
  let status;
  let approvedPath;
  if (options.action === "approve") {
    status = "approved";
    const targetId = String(match2.candidate.id);
    const targetRevision = await approvedTarget(
      options.root,
      options.kind,
      targetId
    );
    const relativeTarget = targetRevision.relativePath;
    const target = path15.join(options.root, relativeTarget);
    const baseRevision = match2.candidate.base_revision && typeof match2.candidate.base_revision === "object" ? match2.candidate.base_revision : {};
    if (targetRevision.sha256 && baseRevision.sha256 !== targetRevision.sha256) {
      throw new CliError(
        "E_UPGRADE_CONFLICT",
        `\u6B63\u5F0F\u8D44\u4EA7\u5728\u5019\u9009\u521B\u5EFA\u540E\u53D1\u751F\u53D8\u5316\uFF0C\u5FC5\u987B\u5148\u4EBA\u5DE5\u5408\u5E76\uFF1A${relativeTarget}`,
        relativeTarget
      );
    }
    const approved = options.kind === "memory" ? `# ${targetId}

${String(match2.candidate.content ?? "")}
` : options.kind === "skill" ? stringifyYaml({
      id: targetId,
      version: 1,
      status: "approved",
      title: String(
        match2.candidate.description ?? targetId
      ),
      steps: Array.isArray(match2.candidate.steps) ? match2.candidate.steps : [String(match2.candidate.description ?? "")],
      approved_at: now,
      approved_by: reviewer
    }) : stringifyYaml({
      id: targetId,
      version: 1,
      status: "approved",
      title: String(match2.candidate.pattern ?? targetId),
      patterns: [String(match2.candidate.pattern ?? "")],
      guidance: [String(match2.candidate.recommendation ?? "")],
      approved_at: now,
      approved_by: reviewer
    });
    if (!options.dryRun) {
      if (targetRevision.sha256) {
        await writeFile4(target, approved, "utf8");
      } else {
        await writeFileExclusive(target, approved);
      }
    }
    approvedPath = relativeTarget;
  } else if (options.action === "reject") {
    status = "rejected";
  } else if (options.action === "archive") {
    status = "archived";
  } else {
    const mergeTarget = await approvedTarget(
      options.root,
      options.kind,
      options.mergedInto
    );
    if (!await exists(path15.join(options.root, mergeTarget.relativePath))) {
      throw new CliError("E_INVALID_CANDIDATE", "merge \u76EE\u6807\u8D44\u4EA7\u4E0D\u5B58\u5728\u3002");
    }
    status = "merged";
  }
  const updated = {
    ...match2.candidate,
    status,
    review: {
      ...review,
      ...options.action === "approve" ? {
        approved_by: reviewer,
        approved_at: now,
        git_commit: gitCommit,
        base_revision: match2.candidate.base_revision ?? null
      } : {},
      ...options.action === "reject" ? { rejected_by: reviewer, rejected_at: now } : {},
      ...options.action === "merge" ? { merged_into: options.mergedInto } : {}
    },
    updated_at: now
  };
  if (!options.dryRun) {
    await writeFile4(
      path15.join(options.root, match2.source),
      stringifyYaml(updated),
      "utf8"
    );
  }
  return {
    action: options.action,
    dryRun: Boolean(options.dryRun),
    source: match2.source,
    approvedPath,
    candidate: updated
  };
}

// src/core/asset-reader.ts
var defaultWeights = {
  memory: 0.7,
  skill: 0.8,
  fix: 0.7
};
function tokens(value) {
  const wordTokens = value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 3);
  const cjkTokens = [...value.matchAll(/[\p{Script=Han}]{2,}/gu)].flatMap(([sequence]) => {
    const characters = [...sequence];
    return [
      ...characters.slice(0, -1).map(
        (character, index) => `${character}${characters[index + 1]}`
      ),
      ...characters.slice(0, -2).map(
        (character, index) => `${character}${characters[index + 1]}${characters[index + 2]}`
      )
    ];
  });
  return [...wordTokens, ...cjkTokens];
}
function relevance(task, content) {
  const query = tokens(task);
  const document = tokens(content);
  if (!query.length || !document.length) return 0;
  const querySet = new Set(query);
  const documentSet = new Set(document);
  const overlap = [...querySet].filter((token) => documentSet.has(token));
  if (!overlap.length) return 0;
  const termFrequency = /* @__PURE__ */ new Map();
  for (const token of document) {
    termFrequency.set(token, (termFrequency.get(token) ?? 0) + 1);
  }
  const averageLength = 120;
  const k1 = 1.2;
  const b = 0.75;
  const bm25 = overlap.reduce((sum, token) => {
    const tf = termFrequency.get(token) ?? 0;
    return sum + tf * (k1 + 1) / (tf + k1 * (1 - b + b * document.length / averageLength));
  }, 0) / querySet.size;
  const jaccard = overlap.length / (/* @__PURE__ */ new Set([...querySet, ...documentSet])).size;
  const entityMatch = [...task.matchAll(/[A-Z][A-Za-z0-9_.-]{2,}|[\w./-]+\.(?:ts|js|json|ya?ml|md)/g)].some(([entity]) => content.toLowerCase().includes(entity.toLowerCase())) ? 1 : 0;
  return Math.min(1, 0.55 * bm25 + 0.35 * jaccard + 0.1 * entityMatch);
}
function ranked(item) {
  const relevanceScore = item.relevanceScore ?? 0;
  const relevanceValue = relevanceScore;
  const qualityScore = item.finalWeight ?? item.baseWeight ?? 0.5;
  const freshnessScore = 1;
  const scopeMatch = relevanceScore > 0 ? 1 : 0;
  const diversityScore = 1;
  return {
    ...item,
    qualityScore,
    freshnessScore,
    scopeMatch,
    diversityScore,
    retrievalRank: 0.55 * relevanceValue + 0.2 * qualityScore + 0.1 * freshnessScore + 0.1 * scopeMatch + 0.05 * diversityScore
  };
}
function artifactContent(value) {
  if (!value || typeof value !== "object") return String(value ?? "");
  const record = value;
  const selected = [
    record.title,
    record.description,
    record.content,
    record.steps,
    record.patterns,
    record.guidance,
    record.recommendation
  ].filter(Boolean);
  return selected.flatMap((item) => Array.isArray(item) ? item : [item]).map(String).join("\n");
}
function validateApprovedArtifact(value, kind, relativePath) {
  if (typeof value.id !== "string" || value.status !== "approved") {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "\u6B63\u5F0F\u8D44\u4EA7\u5FC5\u987B\u5305\u542B id \u4E14 status \u5FC5\u987B\u4E3A approved\u3002",
      relativePath
    );
  }
  if (kind === "skill" && (!Array.isArray(value.steps) || value.steps.length === 0)) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "\u5DF2\u6279\u51C6 Skill \u5FC5\u987B\u5305\u542B\u975E\u7A7A steps\u3002",
      relativePath
    );
  }
  if (kind === "fix" && (!Array.isArray(value.patterns) || value.patterns.length === 0 || !Array.isArray(value.guidance) || value.guidance.length === 0)) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "\u5DF2\u6279\u51C6 Fix Pattern \u5FC5\u987B\u5305\u542B\u975E\u7A7A patterns \u548C guidance\u3002",
      relativePath
    );
  }
}
async function readApprovedDirectory(root, relativeDirectory, kind, task) {
  const assetRoot = await resolveAssetRoot(root);
  const base = path16.join(assetRoot.path, relativeDirectory);
  const files = (await listFiles(base)).filter((file) => /\.(md|ya?ml)$/i.test(file));
  const items = await Promise.all(
    files.map(async (file) => {
      const relativePath = path16.relative(root, file).replaceAll("\\", "/");
      if (/\.md$/i.test(file)) {
        const content2 = redactSecrets(await readFile8(file, "utf8"));
        const id2 = relativePath.replace(/^\.repo-agent\/memories\//, "memory.").replace(/\.md$/, "").replaceAll("/", ".");
        return {
          id: id2,
          source: relativePath,
          trusted: true,
          content: content2,
          baseWeight: defaultWeights[kind],
          finalWeight: defaultWeights[kind],
          relevanceScore: relevance(task, content2),
          reason: "\u4ED3\u5E93\u4E2D\u7684\u5DF2\u6279\u51C6\u8D44\u4EA7\u3002"
        };
      }
      const value = await readYaml(file);
      validateApprovedArtifact(value, kind, relativePath);
      const id = typeof value.id === "string" ? value.id : void 0;
      const configuredWeight = typeof value.score?.final_weight === "number" ? value.score.final_weight : defaultWeights[kind];
      const content = redactSecrets(artifactContent(value));
      return {
        id,
        source: relativePath,
        trusted: true,
        content,
        baseWeight: configuredWeight,
        finalWeight: configuredWeight,
        relevanceScore: relevance(task, content),
        reason: "\u4ED3\u5E93\u4E2D\u7684\u5DF2\u6279\u51C6\u8D44\u4EA7\u3002"
      };
    })
  );
  return items.map(ranked).sort((a, b) => {
    const relevanceDifference = relevance(task, b.content) - relevance(task, a.content);
    return relevanceDifference || (b.finalWeight ?? 0) - (a.finalWeight ?? 0);
  });
}
var readMemories = (root, task) => readApprovedDirectory(root, "memories", "memory", task);
var readSkills = (root, task) => readApprovedDirectory(root, "skills/approved", "skill", task);
var readFixPatterns = (root, task) => readApprovedDirectory(root, "fix_patterns/approved", "fix", task);
async function readCandidateSuggestions(root, task, limit) {
  const candidates = (await Promise.all(
    ["memory", "skill", "fix_pattern"].map(
      (kind) => listCandidates(root, kind)
    )
  )).flat();
  const injectionPattern = /(忽略.{0,8}(规则|指令)|ignore.{0,8}(instruction|policy)|读取.{0,8}(密钥|secret)|绕过.{0,8}(策略|policy))/i;
  const items = await Promise.all(
    candidates.filter(
      ({ candidate }) => ["candidate", "validated", "team_proposed"].includes(
        String(candidate.status)
      )
    ).map(async ({ source, candidate: value }) => {
      const content = redactSecrets(artifactContent(value));
      const quarantined = injectionPattern.test(content);
      return ranked({
        id: typeof value.candidate_id === "string" ? value.candidate_id : typeof value.id === "string" ? value.id : void 0,
        source,
        trusted: false,
        content: quarantined ? "\u8BE5\u5019\u9009\u5305\u542B\u7591\u4F3C\u63D0\u793A\u6CE8\u5165\u5185\u5BB9\uFF0C\u5DF2\u9694\u79BB\u3002" : content,
        finalWeight: typeof value.score?.final_weight === "number" ? value.score.final_weight : 0.3,
        relevanceScore: relevance(task, content),
        reason: quarantined ? "\u5019\u9009\u5DF2\u9694\u79BB\uFF0C\u4E0D\u5F97\u4F5C\u4E3A\u5EFA\u8BAE\u6267\u884C\u3002" : "\u5C1A\u672A\u5BA1\u6838\u7684\u5019\u9009\u5185\u5BB9\uFF0C\u4EC5\u4F9B\u53C2\u8003\u3002"
      });
    })
  );
  return items.filter(
    (item) => !item.reason?.includes("\u5DF2\u9694\u79BB") && (item.relevanceScore ?? 0) > 0
  ).sort((a, b) => (b.retrievalRank ?? 0) - (a.retrievalRank ?? 0)).slice(0, limit);
}

// src/core/catalog-builder.ts
async function rebuildCatalog(root, dryRun = false) {
  const assetRoot = await resolveAssetRoot(root);
  const [memories, skills, fixes, memoryCandidates, skillCandidates, fixCandidates] = await Promise.all([
    readMemories(root, ""),
    readSkills(root, ""),
    readFixPatterns(root, ""),
    listCandidates(root, "memory"),
    listCandidates(root, "skill"),
    listCandidates(root, "fix_pattern")
  ]);
  const files = {
    "memories.index.yaml": {
      memories: memories.map((item) => ({ id: item.id, source: item.source, status: "approved", weight: item.finalWeight }))
    },
    "skills.index.yaml": {
      skills: skills.map((item) => ({ id: item.id, source: item.source, status: "approved", weight: item.finalWeight }))
    },
    "fix_patterns.index.yaml": {
      fix_patterns: fixes.map((item) => ({ id: item.id, source: item.source, status: "approved", weight: item.finalWeight }))
    },
    "candidates.index.yaml": {
      candidates: [...memoryCandidates, ...skillCandidates, ...fixCandidates].map(({ source, candidate }) => ({
        id: candidate.candidate_id,
        target_id: candidate.id,
        source,
        status: candidate.status
      }))
    }
  };
  if (!dryRun) {
    const directory = path17.join(assetRoot.path, "catalog");
    await mkdir4(directory, { recursive: true });
    await Promise.all(
      Object.entries(files).map(
        ([name, value]) => writeFile5(path17.join(directory, name), stringifyYaml(value), "utf8")
      )
    );
  }
  return {
    dryRun,
    files: Object.keys(files).map((name) => relativeAssetPath(assetRoot, "catalog", name))
  };
}

// src/core/closure-engine.ts
import path19 from "node:path";
import { mkdir as mkdir6, open as open2, readFile as readFile10, unlink as unlink2 } from "node:fs/promises";

// src/core/event-store.ts
import path18 from "node:path";
import { createHash as createHash2, randomUUID } from "node:crypto";
import {
  mkdir as mkdir5,
  open,
  readFile as readFile9,
  rename,
  unlink,
  writeFile as writeFile6
} from "node:fs/promises";
var maxEventBytes = 256 * 1024;
var maxEventsPerPreflight = 1e4;
var safe = (value) => value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "unknown";
function runtimeRoot(root) {
  return path18.join(root, ".repo-agent-runtime");
}
function eventFile(root, sessionId, preflightId) {
  return path18.join(
    runtimeRoot(root),
    "events",
    safe(sessionId),
    `${safe(preflightId)}.jsonl`
  );
}
function lockFile(root, preflightId) {
  return path18.join(runtimeRoot(root), "locks", `${safe(preflightId)}.lock`);
}
function closureStepKey(preflightId, step, version = 1) {
  return createHash2("sha256").update(`${preflightId}
${step}
${version}`).digest("hex");
}
async function withPreflightLock(root, preflightId, operation) {
  const target = lockFile(root, preflightId);
  await mkdir5(path18.dirname(target), { recursive: true });
  let handle;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      handle = await open(target, "wx");
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  if (!handle) {
    throw new CliError("E_RUNTIME_LOCK", `\u65E0\u6CD5\u83B7\u53D6 Preflight \u9501\uFF1A${preflightId}`);
  }
  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink(target).catch(() => void 0);
  }
}
async function readRuntimeEvents(root, sessionId, preflightId) {
  const file = eventFile(root, sessionId, preflightId);
  if (!await exists(file)) return { events: [], warnings: [] };
  const lines = (await readFile9(file, "utf8")).split("\n").filter(Boolean);
  const events = [];
  const warnings = [];
  const ids = /* @__PURE__ */ new Set();
  for (const [index, line] of lines.entries()) {
    try {
      const event = JSON.parse(line);
      if (ids.has(event.eventId)) {
        warnings.push(`\u4E8B\u4EF6 ID \u91CD\u590D\uFF1A${event.eventId}`);
        continue;
      }
      ids.add(event.eventId);
      events.push(event);
    } catch {
      warnings.push(`\u4E8B\u4EF6\u65E5\u5FD7\u7B2C ${index + 1} \u884C\u635F\u574F\u3002`);
    }
  }
  return { events, warnings };
}
async function appendRuntimeEvent(root, input) {
  return withPreflightLock(root, input.preflightId, async () => {
    const current = await readRuntimeEvents(
      root,
      input.sessionId,
      input.preflightId
    );
    const duplicate = current.events.find(
      (event2) => event2.idempotencyKey === input.idempotencyKey
    );
    if (duplicate) return { event: duplicate, appended: false };
    if (current.events.length >= maxEventsPerPreflight) {
      throw new CliError(
        "E_RUNTIME_LIMIT",
        `Preflight \u4E8B\u4EF6\u6570\u91CF\u8D85\u8FC7\u4E0A\u9650\uFF1A${input.preflightId}`
      );
    }
    const event = {
      version: 1,
      eventId: input.eventId ?? randomUUID(),
      occurredAt: input.occurredAt ?? (/* @__PURE__ */ new Date()).toISOString(),
      eventType: input.eventType,
      sessionId: input.sessionId,
      turnId: input.turnId,
      preflightId: input.preflightId,
      producer: input.producer,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload
    };
    if (current.events.some((item) => item.eventId === event.eventId)) {
      throw new CliError("E_RUNTIME_DUPLICATE", `\u4E8B\u4EF6 ID \u5DF2\u5B58\u5728\uFF1A${event.eventId}`);
    }
    const serialized = `${JSON.stringify(event)}
`;
    if (Buffer.byteLength(serialized) > maxEventBytes) {
      throw new CliError("E_RUNTIME_LIMIT", "\u5355\u4E2A\u8FD0\u884C\u65F6\u4E8B\u4EF6\u8D85\u8FC7 256KB\u3002");
    }
    const file = eventFile(root, input.sessionId, input.preflightId);
    await mkdir5(path18.dirname(file), { recursive: true });
    const previous = await exists(file) ? await readFile9(file, "utf8") : "";
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile6(temporary, previous + serialized, "utf8");
    await rename(temporary, file);
    return { event, appended: true };
  });
}
async function writeRuntimeSnapshot(root, relativePath, value) {
  const file = path18.join(runtimeRoot(root), relativePath);
  await mkdir5(path18.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile6(temporary, `${JSON.stringify(value, null, 2)}
`, "utf8");
  await rename(temporary, file);
}
var runtimePath = (root, ...segments) => path18.join(runtimeRoot(root), ...segments);

// src/core/closure-engine.ts
var closureSteps = [
  "commit_advice",
  "audit_recorded",
  "observation_captured",
  "recurring_analyzed",
  "lifecycle_evaluated",
  "metrics_updated"
];
function receiptPath(sessionId, preflightId) {
  return path19.join(
    "closures",
    sessionId.replace(/[^a-zA-Z0-9._-]/g, "_"),
    `${preflightId.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`
  );
}
async function readClosureReceipt(root, sessionId, preflightId) {
  const file = runtimePath(root, receiptPath(sessionId, preflightId));
  if (!await exists(file)) return null;
  return JSON.parse(await readFile10(file, "utf8"));
}
async function openClosure(input) {
  const existing = await readClosureReceipt(
    input.root,
    input.sessionId,
    input.preflightId
  );
  if (existing) return existing;
  const now = input.openedAt ?? (/* @__PURE__ */ new Date()).toISOString();
  const receipt = {
    version: 1,
    preflightId: input.preflightId,
    sessionId: input.sessionId,
    turnId: input.turnId,
    status: "opened",
    openedAt: now,
    updatedAt: now,
    completedSteps: [],
    failedSteps: []
  };
  await writeRuntimeSnapshot(
    input.root,
    receiptPath(input.sessionId, input.preflightId),
    receipt
  );
  return receipt;
}
async function markClosureStep(input) {
  let receipt = await openClosure(input);
  if (receipt.completedSteps.includes(input.step)) {
    return { receipt, marked: false };
  }
  await appendRuntimeEvent(input.root, {
    eventType: "closure_step_completed",
    sessionId: input.sessionId,
    turnId: input.turnId,
    preflightId: input.preflightId,
    producer: input.producer,
    idempotencyKey: closureStepKey(input.preflightId, input.step),
    payload: { step: input.step, ...input.payload ?? {} }
  });
  receipt = {
    ...receipt,
    status: "closure_pending",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    completedSteps: [.../* @__PURE__ */ new Set([...receipt.completedSteps, input.step])],
    failedSteps: receipt.failedSteps.filter((item) => item.step !== input.step)
  };
  await writeRuntimeSnapshot(
    input.root,
    receiptPath(input.sessionId, input.preflightId),
    receipt
  );
  return { receipt, marked: true };
}
async function ensureClosure(input) {
  if (!input._lockHeld) {
    const lock = runtimePath(
      input.root,
      "locks",
      `${input.preflightId.replace(/[^a-zA-Z0-9._-]/g, "_")}.closure.lock`
    );
    await mkdir6(path19.dirname(lock), { recursive: true });
    let handle;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try {
        handle = await open2(lock, "wx");
        break;
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    if (!handle) throw new Error(`\u65E0\u6CD5\u83B7\u53D6\u95ED\u73AF\u9501\uFF1A${input.preflightId}`);
    try {
      return await ensureClosure({ ...input, _lockHeld: true });
    } finally {
      await handle.close();
      await unlink2(lock).catch(() => void 0);
    }
  }
  let receipt = await openClosure(input);
  if (receipt.status !== "closed" && receipt.status !== "abandoned") {
    receipt = {
      ...receipt,
      status: "executing",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writeRuntimeSnapshot(
      input.root,
      receiptPath(input.sessionId, input.preflightId),
      receipt
    );
  }
  const completedNow = [];
  const failedNow = [];
  for (const step of closureSteps) {
    if (receipt.completedSteps.includes(step)) continue;
    try {
      const payload = await input.handlers[step]();
      await appendRuntimeEvent(input.root, {
        eventType: "closure_step_completed",
        sessionId: input.sessionId,
        turnId: input.turnId,
        preflightId: input.preflightId,
        producer: input.producer,
        idempotencyKey: closureStepKey(input.preflightId, step),
        payload: { step, ...payload ?? {} }
      });
      completedNow.push(step);
      receipt = {
        ...receipt,
        status: "closure_pending",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        completedSteps: [.../* @__PURE__ */ new Set([...receipt.completedSteps, step])],
        failedSteps: receipt.failedSteps.filter((item) => item.step !== step)
      };
      await writeRuntimeSnapshot(
        input.root,
        receiptPath(input.sessionId, input.preflightId),
        receipt
      );
    } catch (error) {
      const failed = {
        step,
        message: error.message,
        failedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      failedNow.push(failed);
      receipt = {
        ...receipt,
        status: "retryable_failed",
        updatedAt: failed.failedAt,
        failedSteps: [
          ...receipt.failedSteps.filter((item) => item.step !== step),
          failed
        ]
      };
      await appendRuntimeEvent(input.root, {
        eventType: "closure_step_failed",
        sessionId: input.sessionId,
        turnId: input.turnId,
        preflightId: input.preflightId,
        producer: input.producer,
        idempotencyKey: `${closureStepKey(input.preflightId, step)}:failed:${failed.failedAt}`,
        payload: { step, message: failed.message }
      });
      await writeRuntimeSnapshot(
        input.root,
        receiptPath(input.sessionId, input.preflightId),
        receipt
      );
      break;
    }
  }
  if (closureSteps.every((step) => receipt.completedSteps.includes(step))) {
    receipt = {
      ...receipt,
      status: "closed",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await appendRuntimeEvent(input.root, {
      eventType: "turn_closed",
      sessionId: input.sessionId,
      turnId: input.turnId,
      preflightId: input.preflightId,
      producer: input.producer,
      idempotencyKey: closureStepKey(input.preflightId, "turn_closed"),
      payload: { completedSteps: receipt.completedSteps }
    });
    await writeRuntimeSnapshot(
      input.root,
      receiptPath(input.sessionId, input.preflightId),
      receipt
    );
  }
  return { receipt, completedNow, failedNow };
}
async function listClosureReceipts(root) {
  const files = (await listFiles(runtimePath(root, "closures"))).filter((file) => file.endsWith(".json"));
  return Promise.all(
    files.map(
      async (file) => JSON.parse(await readFile10(file, "utf8"))
    )
  );
}
async function abandonExpiredClosures(root, hours = 24) {
  const cutoff = Date.now() - hours * 36e5;
  const changed = [];
  for (const receipt of await listClosureReceipts(root)) {
    if (receipt.status === "closed" || receipt.status === "abandoned") continue;
    if (Date.parse(receipt.openedAt) > cutoff) continue;
    const updated = {
      ...receipt,
      status: "abandoned",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writeRuntimeSnapshot(
      root,
      receiptPath(receipt.sessionId, receipt.preflightId),
      updated
    );
    changed.push(receipt.preflightId);
  }
  return changed;
}
async function closureDiagnostics(root) {
  const receipts = await listClosureReceipts(root);
  const eventWarnings = [];
  for (const receipt of receipts) {
    const result = await readRuntimeEvents(
      root,
      receipt.sessionId,
      receipt.preflightId
    );
    eventWarnings.push(...result.warnings.map(
      (warning) => `${receipt.preflightId}: ${warning}`
    ));
  }
  return {
    receipts,
    eventWarnings,
    counts: Object.fromEntries(
      ["opened", "executing", "closure_pending", "closed", "retryable_failed", "abandoned"].map((status) => [
        status,
        receipts.filter((item) => item.status === status).length
      ])
    )
  };
}

// src/core/asset-lifecycle.ts
import path23 from "node:path";
import { createHash as createHash4 } from "node:crypto";
import { mkdir as mkdir9, readFile as readFile12, rename as rename3, unlink as unlink4, writeFile as writeFile9 } from "node:fs/promises";

// src/core/learning-inbox.ts
import path20 from "node:path";
import { randomUUID as randomUUID2 } from "node:crypto";
import { mkdir as mkdir7, writeFile as writeFile7 } from "node:fs/promises";

// src/core/learning-router.ts
function classifyLearning(task, observation) {
  const text = `${task} ${observation}`.toLowerCase();
  if (/(business rule|requirement|业务规则|需求规范)/.test(text)) {
    return { classification: "spec_candidate", reason: "\u8BE5\u89C2\u5BDF\u63CF\u8FF0\u4E86\u6B63\u5F0F\u4E1A\u52A1\u89C4\u5219\u3002", writableAsCandidate: false };
  }
  if (/(architecture|architectural decision|架构|技术选型)/.test(text)) {
    return { classification: "adr_candidate", reason: "\u8BE5\u89C2\u5BDF\u63CF\u8FF0\u4E86\u67B6\u6784\u51B3\u7B56\u3002", writableAsCandidate: false };
  }
  if (/(security boundary|must not|forbidden|安全边界|禁止)/.test(text)) {
    return { classification: "policy_candidate", reason: "\u8BE5\u89C2\u5BDF\u63CF\u8FF0\u4E86\u7B56\u7565\u6216\u5B89\u5168\u8FB9\u754C\u3002", writableAsCandidate: false };
  }
  if (/(first|then|finally|steps?|workflow|process|先.*再|步骤|流程)/.test(text)) {
    return { classification: "skill_candidate", reason: "\u8BE5\u89C2\u5BDF\u63CF\u8FF0\u4E86\u53EF\u91CD\u590D\u6267\u884C\u7684\u5DE5\u4F5C\u6D41\u7A0B\u3002", writableAsCandidate: true };
  }
  if (/(error|exception|failure|failed|bug|错误|异常|失败).*(fix|resolve|repair|修复|解决)/.test(text)) {
    return { classification: "fix_pattern_candidate", reason: "\u8BE5\u89C2\u5BDF\u63CF\u8FF0\u4E86\u9519\u8BEF\u6A21\u5F0F\u4E0E\u4FEE\u590D\u65B9\u6CD5\u7684\u6620\u5C04\u3002", writableAsCandidate: true };
  }
  if (/(must cover|test mapping|convention|gotcha|踩坑|必须覆盖|约定|测试映射)/.test(text)) {
    return { classification: "memory_candidate", reason: "\u8BE5\u89C2\u5BDF\u8BB0\u5F55\u4E86\u53EF\u590D\u7528\u7684\u9879\u76EE\u77E5\u8BC6\u3002", writableAsCandidate: true };
  }
  return { classification: "trace_only", reason: "\u672A\u5339\u914D\u5230\u9002\u5408\u957F\u671F\u6C89\u6DC0\u7684\u5B66\u4E60\u7C7B\u522B\u3002", writableAsCandidate: false };
}

// src/core/learning-inbox.ts
async function listInbox(root) {
  const assetRoot = await resolveAssetRoot(root);
  const files = (await Promise.all([
    listFiles(path20.join(assetRoot.path, "learning_inbox")),
    listFiles(privateAssetPath(root, "learning_inbox"))
  ])).flat().filter((file) => /\.ya?ml$/i.test(file));
  return Promise.all(files.map(async (file) => ({
    source: path20.relative(root, file).replaceAll("\\", "/"),
    item: await readYaml(file)
  })));
}
async function createInbox(root, task, observation, dryRun = false, options = {}) {
  if (containsPossibleSecret(observation)) {
    throw new CliError("E_SECRET_DETECTED", "Learning Inbox \u6761\u76EE\u53EF\u80FD\u5305\u542B\u654F\u611F\u4FE1\u606F\u3002");
  }
  const now = /* @__PURE__ */ new Date();
  const existing = await listInbox(root);
  const duplicate = existing.find(
    ({ item: item2 }) => options.dedupeKey ? item2.dedupe_key === options.dedupeKey : item2.task === task && item2.observation === observation
  );
  if (duplicate) {
    const updated = options.dedupeKey && duplicate.item.observation !== observation ? {
      ...duplicate.item,
      task,
      observation,
      updated_at: now.toISOString()
    } : duplicate.item;
    if (!dryRun && updated !== duplicate.item) {
      await writeFile7(path20.join(root, duplicate.source), stringifyYaml(updated), "utf8");
    }
    return {
      dryRun,
      path: duplicate.source,
      item: updated,
      duplicate: true,
      updated: updated !== duplicate.item
    };
  }
  const slug = task.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "learning";
  const unique2 = randomUUID2();
  const id = `inbox.${now.toISOString().slice(0, 10).replaceAll("-", "")}.${slug}.${unique2}`;
  const target = privateAssetPath(
    root,
    "learning_inbox",
    `inbox_${now.getTime()}_${slug}_${unique2}.yaml`
  );
  const relativePath = path20.relative(root, target).replaceAll("\\", "/");
  const classification = classifyLearning(task, observation);
  const item = {
    id,
    status: "untriaged",
    task,
    observation,
    suggested_targets: [classification.classification],
    confidence: classification.writableAsCandidate ? 0.62 : 0.4,
    evidence: { changed_files: [], tests: [] },
    ...options.dedupeKey ? { dedupe_key: options.dedupeKey } : {},
    created_at: now.toISOString(),
    created_by: options.createdBy ?? "agent"
  };
  if (!dryRun) {
    const target2 = path20.join(root, relativePath);
    await mkdir7(path20.dirname(target2), { recursive: true });
    await writeFile7(target2, stringifyYaml(item), "utf8");
  }
  return { dryRun, path: relativePath, item };
}
async function triageInbox(root, id, dryRun = false) {
  const entries = await listInbox(root);
  const match2 = entries.find(({ item }) => item.id === id);
  if (!match2) throw new CliError("E_INVALID_CANDIDATE", `\u672A\u627E\u5230 Learning Inbox \u6761\u76EE\uFF1A${id}`);
  const task = String(match2.item.task ?? "");
  const observation = String(match2.item.observation ?? "");
  const classification = classifyLearning(task, observation);
  const updated = { ...match2.item, status: "triaged", triage: classification, triaged_at: (/* @__PURE__ */ new Date()).toISOString() };
  if (!dryRun) await writeFile7(path20.join(root, match2.source), stringifyYaml(updated), "utf8");
  return { dryRun, source: match2.source, classification, item: updated };
}

// src/core/evidence-manager.ts
import path22 from "node:path";
import { createHash as createHash3, randomUUID as randomUUID3 } from "node:crypto";
import {
  appendFile,
  mkdir as mkdir8,
  open as open3,
  readFile as readFile11,
  rename as rename2,
  unlink as unlink3,
  writeFile as writeFile8
} from "node:fs/promises";

// src/core/config-loader.ts
import path21 from "node:path";
import { stat } from "node:fs/promises";
var configCache = /* @__PURE__ */ new Map();
async function fileSignature(target) {
  try {
    const info = await stat(target);
    return `${info.size}:${info.mtimeMs}`;
  } catch {
    return "missing";
  }
}
async function configSignature(agentRoot) {
  const targets = [
    path21.join(agentRoot, "config.yaml"),
    path21.join(agentRoot, "commit_policy.yaml"),
    path21.join(agentRoot, "policies", "protected_files.yaml"),
    path21.join(agentRoot, "policies", "command_policy.yaml")
  ];
  const parts = await Promise.all(targets.map(fileSignature));
  return parts.join("|");
}
async function loadConfig(root) {
  const assetRoot = await resolveAssetRoot(root);
  const signature = await configSignature(assetRoot.path);
  const cached = configCache.get(root);
  if (cached && cached.signature === signature) {
    return cached.value;
  }
  const value = await loadConfigUncached(root);
  configCache.set(root, { signature, value });
  return value;
}
async function loadConfigUncached(root) {
  const assetRoot = await resolveAssetRoot(root);
  const agentRoot = assetRoot.path;
  const configPath = path21.join(agentRoot, "config.yaml");
  if (!await exists(configPath)) {
    throw new CliError(
      "E_PROJECT_NOT_INITIALIZED",
      "\u9879\u76EE\u5C1A\u672A\u521D\u59CB\u5316\uFF0C\u8BF7\u8FD0\u884C `repo-agent init`\u3002",
      relativeAssetPath(assetRoot, "config.yaml")
    );
  }
  return {
    config: await readYaml(configPath),
    commitPolicy: await readYaml(
      path21.join(agentRoot, "commit_policy.yaml")
    ),
    protectedFiles: await readYaml(
      path21.join(agentRoot, "policies", "protected_files.yaml")
    ),
    commandPolicy: await readYaml(
      path21.join(agentRoot, "policies", "command_policy.yaml")
    )
  };
}

// src/core/evidence-manager.ts
var eventsPath = (root) => privateAssetPath(root, "evidence", "events.jsonl");
var materializedPath = (root) => privateAssetPath(root, "evidence", "materialized.json");
function evidenceId(input) {
  return createHash3("sha256").update(`${input.preflightId}
${input.assetId}
${input.type}`).digest("hex");
}
async function readEvidenceEvents(root) {
  const file = eventsPath(root);
  if (!await exists(file)) return [];
  const events = [];
  for (const line of (await readFile11(file, "utf8")).split("\n").filter(Boolean)) {
    try {
      const event = JSON.parse(line);
      if (event.version === 1 && event.evidenceId) events.push(event);
    } catch {
    }
  }
  return events;
}
async function withLock(root, operation) {
  const lock = privateAssetPath(root, "evidence", "events.lock");
  await mkdir8(path22.dirname(lock), { recursive: true });
  let handle;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      handle = await open3(lock, "wx");
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  if (!handle) throw new Error("Evidence \u8D26\u672C\u6B63\u88AB\u5176\u4ED6\u8FDB\u7A0B\u5360\u7528\u3002");
  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink3(lock).catch(() => void 0);
  }
}
async function appendEvidence(root, inputs) {
  if (!inputs.length) return { appended: 0, duplicates: 0 };
  return withLock(root, async () => {
    const existing = await readEvidenceEvents(root);
    const seen = new Set(existing.map((item) => item.evidenceId));
    const additions = [];
    let duplicates = 0;
    for (const input of inputs) {
      const id = input.evidenceId ?? evidenceId(input);
      if (seen.has(id)) {
        duplicates += 1;
        continue;
      }
      seen.add(id);
      additions.push({
        version: 1,
        evidenceId: id,
        occurredAt: input.occurredAt ?? (/* @__PURE__ */ new Date()).toISOString(),
        assetId: input.assetId,
        preflightId: input.preflightId,
        sessionId: input.sessionId,
        type: input.type,
        outcomeSource: input.outcomeSource,
        confidence: Math.max(0, Math.min(1, input.confidence))
      });
    }
    if (additions.length) {
      const file = eventsPath(root);
      await mkdir8(path22.dirname(file), { recursive: true });
      await appendFile(
        file,
        additions.map((item) => JSON.stringify(item)).join("\n") + "\n",
        "utf8"
      );
      await materializeEvidence(root, [...existing, ...additions]);
    }
    return { appended: additions.length, duplicates };
  });
}
function logGamma(value) {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9984369578019572e-21,
    15056327351493116e-23
  ];
  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }
  let x2 = 0.9999999999998099;
  const shifted = value - 1;
  for (const [index, coefficient] of coefficients.entries()) {
    x2 += coefficient / (shifted + index + 1);
  }
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x2);
}
function betaFraction(a, b, x2) {
  const maximumIterations = 120;
  const epsilon = 3e-10;
  const floor = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - qab * x2 / qap;
  if (Math.abs(d) < floor) d = floor;
  d = 1 / d;
  let h = d;
  for (let iteration = 1; iteration <= maximumIterations; iteration += 1) {
    const twice = 2 * iteration;
    let aa = iteration * (b - iteration) * x2 / ((qam + twice) * (a + twice));
    d = 1 + aa * d;
    if (Math.abs(d) < floor) d = floor;
    c = 1 + aa / c;
    if (Math.abs(c) < floor) c = floor;
    d = 1 / d;
    h *= d * c;
    aa = -(a + iteration) * (qab + iteration) * x2 / ((a + twice) * (qap + twice));
    d = 1 + aa * d;
    if (Math.abs(d) < floor) d = floor;
    c = 1 + aa / c;
    if (Math.abs(c) < floor) c = floor;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < epsilon) break;
  }
  return h;
}
function regularizedBeta(x2, a, b) {
  if (x2 <= 0) return 0;
  if (x2 >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x2) + b * Math.log(1 - x2)
  );
  return x2 < (a + 1) / (a + b + 2) ? front * betaFraction(a, b, x2) / a : 1 - front * betaFraction(b, a, 1 - x2) / b;
}
function lowerBound(success, failure) {
  const alpha = success + 2;
  const beta = failure + 2;
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const middle = (low + high) / 2;
    if (regularizedBeta(middle, alpha, beta) < 0.1) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
function summarizeAssetEvidence(assetId, events, now = Date.now(), freshnessHalfLifeDays = 180) {
  const selected = events.filter((item) => item.assetId === assetId);
  const count = (type) => selected.filter((item) => item.type === type).length;
  const successes = count("validated_success");
  const failures = count("validated_failure");
  const applied = selected.filter(
    (item) => ["applied", "validated_success", "validated_failure"].includes(item.type)
  );
  const lastAppliedAt = applied.map((item) => item.occurredAt).sort().at(-1);
  const ageDays = lastAppliedAt ? Math.max(0, (now - Date.parse(lastAppliedAt)) / 864e5) : 365;
  const freshness = 0.5 ** (ageDays / freshnessHalfLifeDays);
  const distinctValidatedUse = new Set(
    selected.filter(
      (item) => item.type === "validated_success" || item.type === "validated_failure"
    ).map((item) => item.preflightId)
  ).size;
  const qualityLowerBound = lowerBound(successes, failures);
  const reviewTrust = Math.min(1, count("review_approved"));
  const contradictionPenalty = Math.min(0.6, count("contradicted") * 0.15);
  const lifecycleHealth = Math.max(
    0,
    Math.min(
      1,
      0.4 * qualityLowerBound + 0.25 * (1 - Math.exp(-distinctValidatedUse / 8)) + 0.2 * freshness + 0.15 * reviewTrust - contradictionPenalty
    )
  );
  return {
    assetId,
    retrieved: count("retrieved"),
    applied: count("applied"),
    validatedSuccess: successes,
    validatedFailure: failures,
    contradicted: count("contradicted"),
    reviewApproved: count("review_approved"),
    distinctValidatedUse,
    ...lastAppliedAt ? { lastAppliedAt } : {},
    qualityLowerBound,
    freshness,
    reviewTrust,
    lifecycleHealth
  };
}
async function materializeEvidence(root, events) {
  const sourceEvents = events ?? await readEvidenceEvents(root);
  const halfLifeDays = (await loadConfig(root)).config.evidence_policy?.freshness_half_life_days ?? 180;
  const ids = [...new Set(sourceEvents.map((item) => item.assetId))];
  const value = {
    version: 1,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    assets: Object.fromEntries(
      ids.map((id) => [
        id,
        summarizeAssetEvidence(id, sourceEvents, Date.now(), halfLifeDays)
      ])
    )
  };
  const file = materializedPath(root);
  await mkdir8(path22.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID3()}.tmp`;
  await writeFile8(temporary, `${JSON.stringify(value, null, 2)}
`, "utf8");
  await rename2(temporary, file);
  return value;
}
async function explainEvidence(root, assetId) {
  const events = await readEvidenceEvents(root);
  const halfLifeDays = (await loadConfig(root)).config.evidence_policy?.freshness_half_life_days ?? 180;
  return {
    modelVersion: 1,
    summary: summarizeAssetEvidence(
      assetId,
      events,
      Date.now(),
      halfLifeDays
    ),
    events: events.filter((item) => item.assetId === assetId)
  };
}

// src/core/asset-lifecycle.ts
var DAY = 864e5;
var defaults2 = {
  staleHealth: 0.45,
  archiveHealth: 0.3,
  staleDays: 90,
  archiveDays: 180,
  deleteDays: 180,
  privateRetentionDays: 180
};
function protectedAsset(source) {
  return /\/(policies|workflows|review_lenses)\//.test(source) || /security/i.test(source);
}
function proposalId(assetId, action) {
  return `lifecycle.${action}.${createHash4("sha256").update(`${assetId}
${action}`).digest("hex").slice(0, 20)}`;
}
async function proposalDirectory(root) {
  const assetRoot = await resolveAssetRoot(root);
  return path23.join(assetRoot.path, "lifecycle_proposals");
}
async function writeProposal(root, proposal, dryRun) {
  const directory = await proposalDirectory(root);
  const target = path23.join(directory, `${proposal.proposal_id}.yaml`);
  if (!dryRun) {
    await mkdir9(directory, { recursive: true });
    if (!await exists(target)) {
      await writeFile9(target, stringifyYaml(proposal), "utf8");
    }
  }
  return path23.relative(root, target).replaceAll("\\", "/");
}
async function listLifecycleProposals(root) {
  const directory = await proposalDirectory(root);
  const files = (await listFiles(directory)).filter(
    (file) => /\.ya?ml$/i.test(file)
  );
  return Promise.all(files.map(async (file) => ({
    source: path23.relative(root, file).replaceAll("\\", "/"),
    proposal: await readYaml(file)
  })));
}
async function proposeLifecycleRestore(root, assetId, dryRun = false) {
  const history = (await listLifecycleProposals(root)).find(
    ({ proposal: proposal2 }) => proposal2.asset_id === assetId && proposal2.action === "archive"
  );
  if (!history) {
    throw new CliError("E_INVALID_CANDIDATE", `\u672A\u627E\u5230\u8D44\u4EA7 ${assetId} \u7684\u5F52\u6863\u8BB0\u5F55\u3002`);
  }
  const proposal = {
    ...history.proposal,
    proposal_id: proposalId(assetId, "restore"),
    action: "restore",
    status: "pending_review",
    generated_at: (/* @__PURE__ */ new Date()).toISOString(),
    review: { required: true, reviewer: null, reviewed_at: null }
  };
  return {
    command: "lifecycle-restore-propose",
    dryRun,
    path: await writeProposal(root, proposal, dryRun),
    proposal
  };
}
async function staleSince(root) {
  const file = privateAssetPath(root, "lifecycle", "thresholds.json");
  if (!await exists(file)) return {};
  try {
    return JSON.parse(await readFile12(file, "utf8"));
  } catch {
    return {};
  }
}
async function writeStaleSince(root, values) {
  const file = privateAssetPath(root, "lifecycle", "thresholds.json");
  await mkdir9(path23.dirname(file), { recursive: true });
  await writeFile9(file, `${JSON.stringify(values, null, 2)}
`, "utf8");
}
async function maintainAssets(root, dryRun = false) {
  const policy = (await loadConfig(root)).config.asset_lifecycle_policy;
  if (policy?.enabled === false) {
    return {
      command: "maintain",
      dryRun,
      disabled: true,
      transitions: [],
      proposals: [],
      staleApproved: [],
      removedPrivateCandidates: [],
      removedPrivateInbox: [],
      retentionDays: policy.durations_days?.private_retention ?? defaults2.privateRetentionDays,
      sharedAssetsDeleted: false
    };
  }
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const materialized = await materializeEvidence(root);
  const summaries = materialized.assets;
  const inventory = (await Promise.all([
    readMemories(root, ""),
    readSkills(root, ""),
    readFixPatterns(root, "")
  ])).flat().filter((item) => item.id);
  const thresholds = await staleSince(root);
  const proposals = [];
  const staleApproved = [];
  for (const item of inventory) {
    const id = item.id;
    const health = (summaries[id] ?? summarizeAssetEvidence(id, [])).lifecycleHealth;
    const staleHealth = policy?.thresholds?.stale ?? defaults2.staleHealth;
    const archiveHealth = policy?.thresholds?.archive ?? defaults2.archiveHealth;
    const staleDays = policy?.durations_days?.stale ?? defaults2.staleDays;
    const archiveDays = policy?.durations_days?.archive ?? defaults2.archiveDays;
    if (health >= staleHealth) {
      delete thresholds[id];
      continue;
    }
    thresholds[id] ??= nowIso;
    const ageDays = Math.max(0, (now - Date.parse(thresholds[id])) / DAY);
    if (ageDays >= staleDays) {
      staleApproved.push({ id, source: item.source, health });
    }
    if (health < archiveHealth && ageDays >= archiveDays && !protectedAsset(item.source)) {
      const proposal = {
        version: 1,
        proposal_id: proposalId(id, "archive"),
        asset_id: id,
        action: "archive",
        status: "pending_review",
        source: item.source,
        replacement_id: null,
        health,
        threshold_since: thresholds[id],
        generated_at: nowIso,
        review: { required: true, reviewer: null, reviewed_at: null }
      };
      proposals.push({
        path: await writeProposal(root, proposal, dryRun),
        proposal
      });
    }
  }
  const inventoryIds = new Set(inventory.map((item) => item.id));
  const deleteDays = policy?.durations_days?.delete ?? defaults2.deleteDays;
  for (const { proposal: archived } of await listLifecycleProposals(root)) {
    if (archived.action !== "archive" || archived.status !== "applied" || !archived.review.reviewed_at || !archived.replacement_id || !inventoryIds.has(archived.replacement_id) || protectedAsset(archived.source) || (now - Date.parse(archived.review.reviewed_at)) / DAY < deleteDays) {
      continue;
    }
    const proposal = {
      ...archived,
      proposal_id: proposalId(archived.asset_id, "delete"),
      action: "delete",
      status: "pending_review",
      generated_at: nowIso,
      review: { required: true, reviewer: null, reviewed_at: null }
    };
    proposals.push({
      path: await writeProposal(root, proposal, dryRun),
      proposal
    });
  }
  const privateRetentionDays = policy?.durations_days?.private_retention ?? defaults2.privateRetentionDays;
  const cutoff = now - privateRetentionDays * DAY;
  const candidates = (await Promise.all(
    ["memory", "skill", "fix_pattern"].map(
      (kind) => listCandidates(root, kind)
    )
  )).flat();
  const removablePrivateCandidates = candidates.filter(
    ({ visibility, candidate }) => {
      if (visibility !== "private") return false;
      if (candidate.manual_hold === true || candidate.status === "in_review") {
        return false;
      }
      const timestamp = Date.parse(
        String(candidate.updated_at ?? candidate.created_at ?? "")
      );
      return Number.isFinite(timestamp) && timestamp <= cutoff;
    }
  );
  const removablePrivateInbox = (await listInbox(root)).filter(
    ({ source, item }) => {
      if (!source.startsWith(".repo-agent-private/")) return false;
      if (item.manual_hold === true || item.status === "in_review") return false;
      const timestamp = Date.parse(
        String(item.updated_at ?? item.created_at ?? "")
      );
      return Number.isFinite(timestamp) && timestamp <= cutoff;
    }
  );
  if (!dryRun && policy?.private_automatic_cleanup !== false) {
    for (const item of removablePrivateCandidates) {
      await unlink4(path23.join(root, item.source)).catch(() => void 0);
    }
    for (const item of removablePrivateInbox) {
      await unlink4(path23.join(root, item.source)).catch(() => void 0);
    }
  }
  if (!dryRun) {
    await writeStaleSince(root, thresholds);
    const report = privateAssetPath(root, "lifecycle", "maintenance.json");
    await mkdir9(path23.dirname(report), { recursive: true });
    await writeFile9(report, `${JSON.stringify({
      version: 1,
      generatedAt: nowIso,
      proposals: proposals.map((item) => item.path),
      removedPrivateCandidates: removablePrivateCandidates.map((item) => item.source),
      removedPrivateInbox: removablePrivateInbox.map((item) => item.source),
      sharedAssetsDeleted: false
    }, null, 2)}
`, "utf8");
  }
  return {
    command: "maintain",
    dryRun,
    transitions: [],
    proposals,
    staleApproved,
    removedPrivateCandidates: removablePrivateCandidates.map((item) => item.source),
    removedPrivateInbox: removablePrivateInbox.map((item) => item.source),
    retentionDays: privateRetentionDays,
    sharedAssetsDeleted: false
  };
}
async function applyLifecycleProposal(root, proposalIdValue, reviewer = "manual-review", dryRun = false) {
  const match2 = (await listLifecycleProposals(root)).find(
    ({ proposal: proposal2 }) => proposal2.proposal_id === proposalIdValue
  );
  if (!match2) {
    throw new CliError("E_INVALID_CANDIDATE", `\u672A\u627E\u5230\u751F\u547D\u5468\u671F\u63D0\u6848\uFF1A${proposalIdValue}`);
  }
  const proposal = match2.proposal;
  if (proposal.status !== "pending_review") {
    throw new CliError("E_INVALID_CANDIDATE", "\u751F\u547D\u5468\u671F\u63D0\u6848\u5DF2\u5904\u7406\u3002");
  }
  if (proposal.action === "delete" && !proposal.replacement_id) {
    throw new CliError("E_INVALID_CANDIDATE", "\u6CA1\u6709\u66FF\u4EE3\u8D44\u4EA7\u65F6\u7981\u6B62\u5220\u9664\u56E2\u961F\u8D44\u4EA7\u3002");
  }
  if (protectedAsset(proposal.source)) {
    throw new CliError("E_POLICY_BLOCKED", "Policy\u3001Security\u3001Workflow \u548C Review Lens \u8D44\u4EA7\u6C38\u4E45\u4FDD\u62A4\u3002");
  }
  const assetRoot = await resolveAssetRoot(root);
  const source = path23.join(root, proposal.source);
  const archive = path23.join(assetRoot.path, "archive", proposal.source.replace(/^\.repo-agent\//, ""));
  if (!dryRun) {
    if (proposal.action === "archive") {
      if (!await exists(source)) throw new CliError("E_WRITE_FAILED", "\u5F85\u5F52\u6863\u8D44\u4EA7\u4E0D\u5B58\u5728\u3002");
      await mkdir9(path23.dirname(archive), { recursive: true });
      await rename3(source, archive);
    } else if (proposal.action === "restore") {
      if (!await exists(archive)) throw new CliError("E_WRITE_FAILED", "\u5F85\u6062\u590D\u5F52\u6863\u8D44\u4EA7\u4E0D\u5B58\u5728\u3002");
      await mkdir9(path23.dirname(source), { recursive: true });
      await rename3(archive, source);
    } else {
      if (!await exists(archive)) throw new CliError("E_WRITE_FAILED", "\u5F85\u5220\u9664\u5F52\u6863\u8D44\u4EA7\u4E0D\u5B58\u5728\u3002");
      await unlink4(archive);
      const tombstone = path23.join(assetRoot.path, "tombstones", `${createHash4("sha256").update(proposal.asset_id).digest("hex")}.yaml`);
      await mkdir9(path23.dirname(tombstone), { recursive: true });
      await writeFile9(tombstone, stringifyYaml({
        version: 1,
        asset_id: proposal.asset_id,
        deleted_at: (/* @__PURE__ */ new Date()).toISOString(),
        replacement_id: proposal.replacement_id,
        reviewer
      }), "utf8");
    }
    proposal.status = "applied";
    proposal.review = {
      required: true,
      reviewer,
      reviewed_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writeFile9(path23.join(root, match2.source), stringifyYaml(proposal), "utf8");
  }
  return { command: "lifecycle-apply", dryRun, proposal, source: match2.source };
}

// src/commands/status.ts
async function getStatus(root, dryRun = false) {
  const assetRoot = await resolveAssetRoot(root);
  const initialized = await exists(path24.join(assetRoot.path, "config.yaml"));
  if (!initialized) {
    return {
      initialized: false,
      mode: null,
      templateVersion: null,
      schemaVersion: null,
      validate: "not_initialized",
      pendingCandidates: { memory: 0, skill: 0, fixPattern: 0 },
      latestAudit: null,
      warnings: ["\u9879\u76EE\u5C1A\u672A\u521D\u59CB\u5316\u3002"],
      capabilities: await detectCapabilities(root),
      gitDirtyFiles: (await getChangedFiles(root)).length
    };
  }
  const [config, lock, validation, capabilities, changedFiles] = await Promise.all([
    readYaml(path24.join(assetRoot.path, "config.yaml")),
    readYaml(path24.join(assetRoot.path, "lock.yaml")),
    validateProject(root),
    detectCapabilities(root),
    getChangedFiles(root)
  ]);
  const catalog = await rebuildCatalog(root, dryRun);
  const [memory, skills, fixes, audits, adapters, closures, proposals, inbox] = await Promise.all([
    listCandidates(root, "memory"),
    listCandidates(root, "skill"),
    listCandidates(root, "fix_pattern"),
    listFiles(path24.join(assetRoot.path, "generated", "audits")),
    listFiles(path24.join(assetRoot.path, "adapters")),
    closureDiagnostics(root),
    listLifecycleProposals(root),
    listInbox(root)
  ]);
  const candidates = [...memory, ...skills, ...fixes];
  const privateCandidates = candidates.filter((item) => item.visibility === "private");
  const teamCandidates = candidates.filter((item) => item.visibility === "team");
  const quarantinedCandidates = candidates.filter(
    ({ candidate }) => candidate.status === "quarantined"
  );
  const repoAgent = lock.repo_agent ?? {};
  return {
    initialized: true,
    mode: config.mode ?? null,
    templateVersion: repoAgent.template_version ?? null,
    schemaVersion: repoAgent.schema_version ?? null,
    validate: validation.ok ? "ok" : "failed",
    pendingCandidates: {
      memory: memory.length,
      skill: skills.length,
      fixPattern: fixes.length
    },
    candidateCounts: {
      private: privateCandidates.length,
      team: teamCandidates.length,
      quarantined: quarantinedCandidates.length
    },
    learningInbox: inbox.length,
    closure: closures.counts,
    lifecycleProposals: proposals.filter(
      ({ proposal }) => proposal.status === "pending_review"
    ).length,
    versions: {
      bundle: VERSION,
      hook: 1,
      mcp: 1,
      runtimeEvent: 1,
      schema: repoAgent.schema_version ?? null,
      template: repoAgent.template_version ?? null
    },
    latestAudit: audits.at(-1) ? path24.relative(root, audits.at(-1)).replaceAll("\\", "/") : null,
    warnings: [
      ...assetRoot.warnings,
      ...validation.warnings.map((warning) => warning.message)
    ],
    capabilities,
    gitDirtyFiles: changedFiles.length,
    adapters: adapters.filter((file) => /\.ya?ml$/i.test(file)).map((file) => path24.basename(file).replace(/\.ya?ml$/i, "")),
    catalog
  };
}

// src/core/context-builder.ts
import path27 from "node:path";
import { readFile as readFile14 } from "node:fs/promises";

// src/core/policy-engine.ts
import path25 from "node:path";
var sensitivePatterns = [".env*", "*.pem", "*.key", "id_rsa", "id_ed25519", "secrets.*"];
function commandMatches(command, pattern) {
  const normalized = command.trim().toLowerCase();
  const expression = pattern.toLowerCase().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(expression).test(normalized);
}
async function checkPolicy(root, input) {
  const loaded = await loadConfig(root);
  const reasons = [];
  const matchedRules = [];
  let blocked = false;
  let requiresReview = false;
  if (input.toolId) {
    const assetRoot = await resolveAssetRoot(root);
    const registryPath = path25.join(assetRoot.path, "tools", "registry.yaml");
    const permissionsPath = path25.join(assetRoot.path, "tools", "permissions.yaml");
    const builtin = getRepoAgentToolByHookId(input.toolId);
    if (builtin?.approvalMode === "prompt") {
      requiresReview = true;
      matchedRules.push(`tool_manifest:${builtin.name}:prompt`);
      reasons.push(`\u5DE5\u5177 ${input.toolId} \u9700\u8981\u5BA2\u6237\u7AEF\u539F\u751F\u5BA1\u6279\u3002`);
    } else if (!builtin && isRepoAgentHookToolId(input.toolId)) {
      blocked = true;
      matchedRules.push("tool_manifest:unknown_repo_agent_tool");
      reasons.push(`repo-agent \u5185\u7F6E\u5DE5\u5177 ${input.toolId} \u672A\u5728 Tool Manifest \u4E2D\u58F0\u660E\u3002`);
    }
    if (await exists(registryPath)) {
      const registry = await readYaml(registryPath);
      const tool2 = registry.tools?.find((item) => item.id === input.toolId);
      if (!tool2 && !builtin && !isRepoAgentHookToolId(input.toolId)) {
        requiresReview = true;
        reasons.push(`\u5DE5\u5177 ${input.toolId} \u672A\u6CE8\u518C\u3002`);
      } else if (tool2?.allowed === false) {
        blocked = true;
        reasons.push(`\u5DE5\u5177 ${input.toolId} \u5DF2\u88AB\u6CE8\u518C\u8868\u7981\u7528\u3002`);
      } else if (tool2?.requires_confirmation === true) {
        requiresReview = true;
        reasons.push(`\u5DE5\u5177 ${input.toolId} \u88AB\u9879\u76EE\u6CE8\u518C\u8868\u8981\u6C42\u786E\u8BA4\u3002`);
      }
    }
    if (await exists(permissionsPath)) {
      const permissions = await readYaml(permissionsPath);
      if (permissions.blocked?.includes(input.toolId)) {
        blocked = true;
        reasons.push(`\u5DE5\u5177 ${input.toolId} \u5DF2\u88AB\u5DE5\u5177\u6743\u9650\u7B56\u7565\u963B\u6B62\u3002`);
      }
      if (permissions.requires_confirmation?.includes(input.toolId)) {
        requiresReview = true;
        reasons.push(`\u5DE5\u5177 ${input.toolId} \u9700\u8981\u786E\u8BA4\u540E\u624D\u80FD\u4F7F\u7528\u3002`);
      }
    }
  }
  for (const rawPath of input.paths ?? []) {
    const repoPath = normalizeRepoPath(rawPath);
    for (const pattern of loaded.protectedFiles.protected_files ?? []) {
      if (!matchRepoGlob(repoPath, pattern)) continue;
      matchedRules.push(`protected_files:${pattern}`);
      if (sensitivePatterns.includes(pattern)) {
        blocked = true;
        reasons.push(`${repoPath} \u547D\u4E2D\u654F\u611F\u4FDD\u62A4\u89C4\u5219 ${pattern}\u3002`);
      } else {
        requiresReview = true;
        reasons.push(`${repoPath} \u547D\u4E2D\u53D7\u4FDD\u62A4\u8DEF\u5F84\u89C4\u5219 ${pattern}\u3002`);
      }
    }
  }
  if (input.command) {
    for (const pattern of loaded.commandPolicy.dangerous_commands ?? []) {
      if (!commandMatches(input.command, pattern)) continue;
      blocked = true;
      matchedRules.push(`dangerous_commands:${pattern}`);
      reasons.push(`\u547D\u4EE4\u547D\u4E2D\u5371\u9669\u547D\u4EE4\u89C4\u5219\uFF1A${pattern}\u3002`);
    }
  }
  if (!reasons.length) reasons.push("\u672A\u547D\u4E2D\u963B\u6B62\u6216\u5F3A\u5236\u5BA1\u6838\u7B56\u7565\u3002");
  return {
    allowed: !blocked,
    requiresReview: requiresReview || blocked,
    blocked,
    reasons,
    matchedRules
  };
}

// src/core/risk-analyzer.ts
var highRiskTerms = [
  "auth",
  "oauth",
  "billing",
  "permission",
  "migration",
  "ci/cd",
  "deployment",
  "security"
];
var highRiskPaths = [
  "auth",
  "billing",
  "permission",
  "database/migrations",
  ".github/workflows",
  "infra/",
  "terraform/",
  ".repo-agent/policies",
  ".repo-agent/memories",
  ".repo-agent/skills/approved",
  ".repo-agent/fix_patterns/approved",
  ".openspec",
  "docs/adr"
];
async function analyzeRisk(root, input) {
  const task = (input.task ?? "").toLowerCase();
  const paths = input.paths ?? [];
  const policy = await checkPolicy(root, { paths, command: input.command });
  const reasons = [...policy.reasons];
  const matchedPaths = paths.filter(
    (file) => highRiskPaths.some((pattern) => file.toLowerCase().includes(pattern))
  );
  const matchedTerms = highRiskTerms.filter((term) => task.includes(term));
  let level = "medium";
  if (policy.blocked) level = "blocked";
  else if (matchedPaths.length || matchedTerms.length) {
    level = "high";
    if (matchedTerms.length) reasons.push(`\u4EFB\u52A1\u547D\u4E2D\u9AD8\u98CE\u9669\u5173\u952E\u8BCD\uFF1A${matchedTerms.join("\u3001")}\u3002`);
    if (matchedPaths.length) reasons.push("\u53D8\u66F4\u6587\u4EF6\u5305\u542B\u9AD8\u98CE\u9669\u8DEF\u5F84\u3002");
  } else if (paths.length > 0 && paths.every((file) => /(^|\/)(readme|docs?\/)|\.md$/i.test(file))) {
    level = "low";
    reasons.push("\u5168\u90E8\u53D8\u66F4\u6587\u4EF6\u5747\u4E3A\u6587\u6863\u3002");
  } else if (!task && !paths.length) {
    level = "low";
    reasons.push("\u672A\u63D0\u4F9B\u4EFB\u52A1\u63CF\u8FF0\u6216\u53D8\u66F4\u6587\u4EF6\u3002");
  }
  if (input.executionEnvironment?.sandboxed === false && input.command && policy.blocked) {
    reasons.push("\u5728\u65E0\u6C99\u7BB1\u73AF\u5883\u4E2D\u8BF7\u6C42\u4E86\u5371\u9669\u547D\u4EE4\u3002");
  }
  if (input.executionEnvironment?.networkAccess === "unrestricted") {
    reasons.push("\u6267\u884C\u73AF\u5883\u5141\u8BB8\u4E0D\u53D7\u9650\u5236\u7684\u7F51\u7EDC\u8BBF\u95EE\u3002");
    if (level === "low" || level === "medium") level = "high";
  }
  return {
    level,
    reasons: [...new Set(reasons)],
    matchedPaths,
    requiresResearch: level === "high" || level === "blocked",
    requiredVerifications: level === "high" || level === "blocked" ? ["\u5BA1\u6838\u76F8\u5173\u9879\u76EE\u89C4\u8303\u548C\u7B56\u7565\u3002", "\u8FD0\u884C\u8D1F\u5411\u6D4B\u8BD5\u548C\u56DE\u5F52\u6D4B\u8BD5\u3002"] : [],
    requiredActions: level === "high" || level === "blocked" ? ["write_plan", "collect_evidence", "run_tests", "create_review_request"] : level === "medium" ? ["run_tests", "request_confirmation"] : ["run_tests"]
  };
}

// src/core/recurring-error-detector.ts
import path26 from "node:path";
import { mkdir as mkdir10, readFile as readFile13, writeFile as writeFile10 } from "node:fs/promises";

// src/core/error-normalizer.ts
function normalizeError(input) {
  const normalized = input.toLowerCase().replace(/\d{4}-\d{2}-\d{2}t[\d:.z+-]+/g, " ").replace(/(?:^|\s)[\w./-]+:\d+(?::\d+)?/g, " ").replace(/\b[a-f0-9]{7,64}\b/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  if (/invalid oauth state|oauth.*state mismatch|csrf state validation failed|callback state mismatch|state mismatch/.test(
    normalized
  )) {
    return {
      key: "error.auth.oauth-invalid-state",
      title: "OAuth state \u65E0\u6548",
      rawSignals: [input],
      keywords: ["oauth", "state", "invalid", "mismatch"],
      scopePaths: ["src/auth/**", "tests/auth/**"],
      confidence: 0.82
    };
  }
  if (!/error|exception|failed|failure|bug|错误|异常|失败/.test(normalized)) return null;
  const keywords = normalized.split(/[^a-z0-9]+/).filter((token) => token.length > 2).slice(0, 5);
  const slug = keywords.join("-") || "unknown";
  return {
    key: `error.general.${slug}`,
    title: keywords.join(" ") || "\u672A\u77E5\u9519\u8BEF",
    rawSignals: [input],
    keywords,
    scopePaths: [],
    confidence: 0.55
  };
}

// src/core/recurring-error-detector.ts
var outputSegments = ["generated", "recurring_errors", "recurring_errors.json"];
async function recurringSettings(root) {
  const policy = (await loadConfig(root)).config.recurring_error_policy;
  const positive = (value, fallback) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
  return {
    enabled: policy?.enabled !== false,
    inboxThreshold: positive(policy?.thresholds?.inbox, 2),
    fixPatternThreshold: positive(policy?.thresholds?.propose_fix_pattern, 3),
    skillThreshold: positive(policy?.thresholds?.propose_skill, 5),
    highRiskMultiplier: positive(policy?.high_risk_multiplier, 0.5),
    maxContextRecommendations: Math.floor(
      positive(policy?.max_context_recommendations, 3)
    )
  };
}
function effectiveThreshold(base, highRisk, multiplier) {
  return Math.max(highRisk ? 2 : 1, Math.ceil(base * (highRisk ? multiplier : 1)));
}
async function sourceRecords(root) {
  const assetRoot = await resolveAssetRoot(root);
  const records = [];
  for (const file of await listFiles(path26.join(assetRoot.path, "generated", "audits"))) {
    if (!file.endsWith(".json")) continue;
    try {
      const value = JSON.parse(await readFile13(file, "utf8"));
      if (value.outcome_status !== "failure") continue;
      const task = String(value.task ?? "");
      const outcome = typeof value.outcome === "string" ? value.outcome : "";
      if (!outcome.trim()) continue;
      records.push({
        text: redactSecrets(outcome),
        task,
        source: path26.relative(root, file).replaceAll("\\", "/"),
        preflightId: String(value.preflight_id ?? value.id ?? file),
        at: String(value.created_at ?? (/* @__PURE__ */ new Date(0)).toISOString()),
        paths: Array.isArray(value.changed_files) ? value.changed_files.map(String) : []
      });
    } catch {
    }
  }
  for (const { source, item: value } of await listInbox(root)) {
    try {
      if (value.created_by === "repo-agent-recurring") continue;
      const evidence = value.evidence && typeof value.evidence === "object" ? value.evidence : {};
      if (value.kind !== "failure" && evidence.failure !== true) continue;
      records.push({
        text: redactSecrets(String(value.observation ?? "")),
        task: String(value.task ?? ""),
        source,
        preflightId: String(evidence.preflight_id ?? value.id ?? source),
        at: String(value.created_at ?? (/* @__PURE__ */ new Date(0)).toISOString()),
        paths: []
      });
    } catch {
    }
  }
  return records;
}
async function normalizeWithAliases(root, text) {
  const assetRoot = await resolveAssetRoot(root);
  const aliasesPath = path26.join(assetRoot.path, "fix_patterns", "error_aliases.yaml");
  if (await exists(aliasesPath)) {
    try {
      const config = await readYaml(aliasesPath);
      const lower = text.toLowerCase();
      for (const [key, alias] of Object.entries(config.aliases ?? {})) {
        const matched = alias.keywords?.filter((keyword) => lower.includes(keyword.toLowerCase())) ?? [];
        if (matched.length) {
          return {
            key,
            title: alias.title ?? key,
            rawSignals: [text],
            keywords: matched,
            scopePaths: alias.scope ?? [],
            confidence: 0.85
          };
        }
      }
    } catch {
    }
  }
  return normalizeError(text);
}
async function analyzeRecurringErrors(root, dryRun = false) {
  const assetRoot = await resolveAssetRoot(root);
  const outputPath = relativeAssetPath(assetRoot, ...outputSegments);
  const settings = await recurringSettings(root);
  if (!settings.enabled) {
    return { dryRun, path: outputPath, signals: [], disabled: true };
  }
  const groups = /* @__PURE__ */ new Map();
  for (const record of await sourceRecords(root)) {
    const normalized = await normalizeWithAliases(root, record.text);
    if (!normalized) continue;
    const group = groups.get(normalized.key) ?? { normalized, records: [] };
    if (!group.records.some((item) => item.preflightId === record.preflightId)) {
      group.records.push(record);
    }
    groups.set(normalized.key, group);
  }
  const approved = await readFixPatterns(root, "");
  const signals = [...groups.values()].map(({ normalized, records }) => {
    const dates = records.map((record) => record.at).sort();
    const highRisk = normalized.key.includes(".auth.");
    const fixPatternThreshold = effectiveThreshold(
      settings.fixPatternThreshold,
      highRisk,
      settings.highRiskMultiplier
    );
    const skillThreshold = effectiveThreshold(
      settings.skillThreshold,
      highRisk,
      settings.highRiskMultiplier
    );
    const existing = approved.find(
      (item) => item.content.toLowerCase().includes(normalized.title.toLowerCase())
    );
    return {
      id: normalized.key.replace(/^error\./, "recurring."),
      normalizedError: normalized,
      occurrences: records.length,
      firstSeenAt: dates[0] ?? "",
      lastSeenAt: dates.at(-1) ?? "",
      affectedPaths: [...new Set(records.flatMap((record) => record.paths))],
      relatedTasks: [...new Set(records.map((record) => record.task).filter(Boolean))],
      relatedAudits: records.map((record) => record.source),
      status: records.length >= skillThreshold ? "recommend_skill" : records.length >= fixPatternThreshold ? "recommend_fix_pattern" : "watching",
      ...existing?.id ? { existingFixPatternId: existing.id } : {}
    };
  }).filter((signal) => !signal.existingFixPatternId);
  if (!dryRun) {
    await mkdir10(path26.dirname(path26.join(root, outputPath)), { recursive: true });
    await writeFile10(path26.join(root, outputPath), `${JSON.stringify({ generatedAt: (/* @__PURE__ */ new Date()).toISOString(), signals }, null, 2)}
`);
    for (const signal of signals.filter((item) => {
      const highRisk = item.normalizedError.key.includes(".auth.");
      return item.occurrences >= effectiveThreshold(
        settings.inboxThreshold,
        highRisk,
        settings.highRiskMultiplier
      );
    })) {
      await createInbox(
        root,
        `\u91CD\u590D\u9519\u8BEF\uFF1A${signal.normalizedError.title}`,
        `${signal.normalizedError.title} \u5DF2\u51FA\u73B0 ${signal.occurrences} \u6B21\u3002`,
        false,
        {
          createdBy: "repo-agent-recurring",
          dedupeKey: signal.id
        }
      );
    }
  }
  return { dryRun, path: outputPath, signals };
}
async function listRecurringErrors(root) {
  const assetRoot = await resolveAssetRoot(root);
  const outputPath = relativeAssetPath(assetRoot, ...outputSegments);
  if (!await exists(path26.join(root, outputPath))) return [];
  const value = JSON.parse(await readFile13(path26.join(root, outputPath), "utf8"));
  return value.signals ?? [];
}
async function recommendRecurringErrors(root, task) {
  const assetRoot = await resolveAssetRoot(root);
  const outputPath = relativeAssetPath(assetRoot, ...outputSegments);
  const settings = await recurringSettings(root);
  if (!settings.enabled) return [];
  const taskLower = task.toLowerCase();
  const signals = await listRecurringErrors(root);
  return signals.filter(
    (signal) => signal.normalizedError.key === "error.auth.oauth-invalid-state" ? /oauth|state|auth/.test(taskLower) : signal.normalizedError.key.split(/[.-]/).some((part) => part.length > 3 && taskLower.includes(part))
  ).map((signal) => ({
    id: signal.id,
    normalizedErrorKey: signal.normalizedError.key,
    occurrences: signal.occurrences,
    summary: `${signal.normalizedError.title} \u5DF2\u51FA\u73B0 ${signal.occurrences} \u6B21\u3002`,
    affectedPaths: signal.affectedPaths,
    existingFixPatternId: signal.existingFixPatternId,
    suggestedSteps: signal.normalizedError.key === "error.auth.oauth-invalid-state" ? ["\u68C0\u67E5 state \u7684\u751F\u6210\u548C\u5B58\u50A8\u3002", "\u4EA4\u6362 token \u524D\u5148\u6821\u9A8C state\u3002", "\u8865\u5145 invalid\u3001missing \u548C expired state \u6D4B\u8BD5\u3002"] : ["\u5BA1\u6838\u76F8\u5173\u5BA1\u8BA1\u8BB0\u5F55\u3002", "\u8865\u5145\u9488\u5BF9\u6027\u56DE\u5F52\u6D4B\u8BD5\u3002"],
    recommendedTests: [],
    suggestedArtifacts: signal.existingFixPatternId ? [] : ["fix_pattern_candidate"],
    confidence: Math.min(0.95, signal.normalizedError.confidence + signal.occurrences * 0.03),
    trusted: false,
    source: outputPath
  })).slice(0, settings.maxContextRecommendations);
}
async function proposeFromRecurring(root, recurringId, dryRun = false) {
  const signal = (await listRecurringErrors(root)).find((item) => item.id === recurringId);
  if (!signal) throw new CliError("E_INVALID_CANDIDATE", `\u672A\u627E\u5230\u91CD\u590D\u9519\u8BEF\uFF1A${recurringId}`);
  const fixId = signal.normalizedError.key.replace(/^error\./, "fix.");
  return proposeCandidate({
    root,
    kind: "fix_pattern",
    id: fixId,
    value: signal.normalizedError.title,
    task: signal.relatedTasks[0],
    dryRun,
    recurrence: {
      occurrences: signal.occurrences,
      first_seen_at: signal.firstSeenAt,
      last_seen_at: signal.lastSeenAt,
      related_audits: signal.relatedAudits
    }
  });
}

// src/core/memory-gate.ts
function evaluateMemory(memory) {
  if (!memory.trusted) {
    return {
      memoryId: memory.id ?? memory.source,
      admitted: false,
      reason: "\u4E0D\u53EF\u4FE1\u6216\u5019\u9009 memory \u4E0D\u80FD\u8FDB\u5165\u53EF\u4FE1\u4E0A\u4E0B\u6587\u3002",
      warnings: ["\u5019\u9009\u5185\u5BB9\u4EC5\u4F9B\u53C2\u8003\u3002"]
    };
  }
  if ((memory.finalWeight ?? 0.7) < 0.3) {
    return {
      memoryId: memory.id ?? memory.source,
      admitted: false,
      reason: "Memory \u7684\u6700\u7EC8\u6743\u91CD\u4F4E\u4E8E\u6700\u4F4E\u9608\u503C\u3002",
      warnings: []
    };
  }
  return {
    memoryId: memory.id ?? memory.source,
    admitted: true,
    reason: "\u5DF2\u6279\u51C6\u4E14\u53EF\u4FE1\u7684 memory \u901A\u8FC7\u4E86\u89C4\u5219\u5F0F\u4FE1\u4EFB\u95E8\u63A7\u3002",
    warnings: []
  };
}

// src/core/context-builder.ts
async function readInstructions(root) {
  const assetRoot = await resolveAssetRoot(root);
  const files = [
    path27.join(assetRoot.path, "config.yaml"),
    path27.join(assetRoot.path, "hooks", "routes.yaml"),
    ...(await listFiles(path27.join(assetRoot.path, "policies"))).filter(
      (file) => /\.ya?ml$/i.test(file)
    )
  ];
  const items = [];
  for (const file of files) {
    try {
      items.push({
        source: path27.relative(root, file).replaceAll("\\", "/"),
        trusted: true,
        content: redactSecrets(await readFile14(file, "utf8")),
        reason: "\u4ED3\u5E93\u6B63\u5F0F\u4E8B\u5B9E\u6E90\u3002"
      });
    } catch {
    }
  }
  return items;
}
async function buildContextPack(root, task, executionEnvironment) {
  const [projectProfile, capabilities, loaded] = await Promise.all([
    scanProject(root),
    detectCapabilities(root),
    loadConfig(root)
  ]);
  const includeCandidates = loaded.config.context?.include_candidate_suggestions ?? true;
  const candidateLimit = Math.min(
    loaded.config.context?.max_candidate_suggestions ?? 1,
    1
  );
  const [
    relevantInstructions,
    relevantMemories,
    relevantSkills,
    recommendedFixPatterns,
    candidateSuggestions,
    recurringRecommendations,
    risk
  ] = await Promise.all([
    readInstructions(root),
    readMemories(root, task),
    readSkills(root, task),
    readFixPatterns(root, task),
    includeCandidates ? readCandidateSuggestions(root, task, candidateLimit) : Promise.resolve([]),
    loaded.config.recurring_error_policy?.include_in_context === false ? Promise.resolve([]) : recommendRecurringErrors(root, task),
    analyzeRisk(root, { task, executionEnvironment })
  ]);
  const maxItems = loaded.config.context?.max_items;
  const truncatedItems = [];
  const limit = (items, maximum, label) => {
    if (maximum === void 0 || items.length <= maximum) return items;
    truncatedItems.push(...items.slice(maximum).map((item) => item.id ?? `${label}:${item.source}`));
    return items.slice(0, maximum);
  };
  const minRelevance = loaded.config.context?.min_relevance ?? 0.15;
  const relevant = (item) => (item.relevanceScore ?? 0) >= minRelevance;
  const diverse = (items) => {
    const selected = [];
    for (const item of items) {
      const words = new Set(
        item.content.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
      );
      const duplicate = selected.some((current) => {
        const currentWords = new Set(
          current.content.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
        );
        const intersection = [...words].filter((word) => currentWords.has(word)).length;
        const union = (/* @__PURE__ */ new Set([...words, ...currentWords])).size;
        return union > 0 && intersection / union >= 0.85;
      });
      if (!duplicate) selected.push(item);
    }
    return selected;
  };
  const admittedMemories = relevantMemories.filter(
    (memory) => evaluateMemory(memory).admitted && relevant(memory)
  );
  const limitedMemories = limit(diverse(admittedMemories), maxItems?.memories ?? 8, "memory");
  const limitedSkills = limit(
    diverse(relevantSkills.filter(
      (item) => (item.finalWeight ?? 0.8) >= 0.3 && relevant(item)
    )),
    maxItems?.skills ?? 4,
    "skill"
  );
  const limitedFixes = limit(
    diverse(recommendedFixPatterns.filter(
      (item) => (item.finalWeight ?? 0.7) >= 0.3 && relevant(item)
    )),
    maxItems?.fix_patterns ?? 4,
    "fix"
  );
  const limitedCandidates = limit(
    candidateSuggestions.filter(relevant),
    maxItems?.candidate_suggestions ?? candidateLimit,
    "candidate"
  );
  const maxChars = loaded.config.context?.budget?.max_chars ?? 24e3;
  const maxTokensEstimate = loaded.config.context?.budget?.max_tokens_estimate ?? 6e3;
  const allItems = [
    ...relevantInstructions,
    ...limitedMemories,
    ...limitedSkills,
    ...limitedFixes,
    ...limitedCandidates
  ];
  const fixedContextChars = JSON.stringify({
    task,
    projectProfile,
    capabilities,
    recurringRecommendations,
    executionEnvironment,
    risk
  }).length;
  const estimatedChars = allItems.reduce((sum, item) => sum + item.content.length, 0) + fixedContextChars;
  const estimateTokens = () => {
    const serialized = JSON.stringify({
      task,
      projectProfile,
      capabilities,
      recurringRecommendations,
      executionEnvironment,
      risk,
      items: allItems
    });
    const cjk = [...serialized.matchAll(/[\p{Script=Han}]/gu)].length;
    const latin = serialized.length - cjk;
    return Math.ceil((cjk + Math.ceil(latin / 4)) * 1.2);
  };
  let estimatedTokens = estimateTokens();
  const removablePools = [
    limitedCandidates,
    limitedFixes,
    limitedSkills,
    limitedMemories
  ];
  for (const pool of removablePools) {
    while (estimatedTokens > maxTokensEstimate && pool.length) {
      const removed = pool.pop();
      truncatedItems.push(removed.id ?? removed.source);
      const index = allItems.indexOf(removed);
      if (index >= 0) allItems.splice(index, 1);
      estimatedTokens = estimateTokens();
    }
  }
  const trustedInstructionsExceedBudget = estimatedChars > maxChars || estimatedTokens > maxTokensEstimate;
  const recommendedTests = Object.values(projectProfile.testCommands).filter(
    (command) => Boolean(command)
  );
  const warnings = [];
  const assetRoot = await resolveAssetRoot(root);
  warnings.push(...assetRoot.warnings);
  if (!capabilities.testCommands) warnings.push("\u672A\u68C0\u6D4B\u5230\u6D4B\u8BD5\u547D\u4EE4\u3002");
  if (!capabilities.openspec) warnings.push("OpenSpec \u4E0D\u53EF\u7528\uFF0C\u5C06\u4F7F\u7528\u540E\u5907\u6D41\u7A0B\u3002");
  if (!capabilities.git) warnings.push("Git \u4E0D\u53EF\u7528\uFF0C\u63D0\u4EA4\u5EFA\u8BAE\u5C06\u91C7\u7528\u5B89\u5168\u964D\u7EA7\u6A21\u5F0F\u3002");
  if (trustedInstructionsExceedBudget) {
    warnings.push(
      "\u5F3A\u5236\u7B56\u7565\u548C\u57FA\u7840\u6CBB\u7406\u5143\u6570\u636E\u8D85\u8FC7\u4E0A\u4E0B\u6587\u9884\u7B97\uFF1B\u53EF\u4FE1\u6307\u4EE4\u5DF2\u5B8C\u6574\u4FDD\u7559\u3002"
    );
  }
  const summarizeApproved = (item) => ({
    ...item,
    content: item.content.length > 800 ? `${item.content.slice(0, 800)}
\u2026\uFF08\u5DF2\u6309\u9ED8\u8BA4\u6458\u8981\u7B56\u7565\u622A\u65AD\uFF09` : item.content
  });
  const summarizedMemories = limitedMemories.map(summarizeApproved);
  const summarizedSkills = limitedSkills.map(summarizeApproved);
  const summarizedFixes = limitedFixes.map(summarizeApproved);
  const trustedAssets = [
    ...summarizedMemories,
    ...summarizedSkills,
    ...summarizedFixes
  ];
  return {
    task,
    projectProfile,
    capabilities,
    mandatoryInstructions: relevantInstructions,
    trustedAssets,
    untrustedAdvisories: limitedCandidates,
    relevantInstructions,
    relevantMemories: summarizedMemories,
    relevantSkills: summarizedSkills,
    recommendedFixPatterns: summarizedFixes,
    candidateSuggestions: limitedCandidates,
    recurringErrorRecommendations: recurringRecommendations,
    contextBudget: {
      maxChars,
      estimatedChars,
      maxTokensEstimate,
      estimatedTokens,
      truncated: truncatedItems.length > 0,
      exceeded: estimatedChars > maxChars || estimatedTokens > maxTokensEstimate,
      truncatedItems
    },
    executionEnvironment,
    recommendedWorkflow: /security|auth|oauth|permission/i.test(task) ? "workflow.security-change" : /bug|fix|error|修复|错误/i.test(task) ? "workflow.bugfix" : "workflow.feature",
    recommendedTests,
    risk,
    policyNotes: [
      `\u5F53\u524D\u7F51\u7EDC\u7B56\u7565\uFF1A${loaded.config.network?.mode ?? "offline"}\u3002`,
      "\u5019\u9009\u5185\u5BB9\u9ED8\u8BA4\u4E0D\u53EF\u4FE1\uFF0C\u4E0D\u80FD\u8986\u76D6\u5DF2\u6279\u51C6\u8D44\u4EA7\u3002"
    ],
    conflictNotes: [],
    warnings,
    nextSteps: [
      ...risk.requiresResearch ? risk.requiredVerifications : [],
      ...recommendedTests.length ? ["\u4FEE\u6539\u5B8C\u6210\u540E\u8FD0\u884C\u63A8\u8350\u6D4B\u8BD5\u3002"] : [],
      "\u53D1\u5E03\u53D8\u66F4\u524D\u83B7\u53D6\u63D0\u4EA4\u5EFA\u8BAE\u3002"
    ]
  };
}

// src/core/commit-policy.ts
async function getCommitOptions(root, input = {}) {
  const [capabilities, loaded] = await Promise.all([
    detectCapabilities(root),
    loadConfig(root)
  ]);
  const changedFiles = input.paths?.length ? input.paths : await getChangedFiles(root);
  const risk = await analyzeRisk(root, { task: input.task, paths: changedFiles });
  const reviewPatterns = loaded.commitPolicy.require_review_request_for ?? [];
  const reviewMatches = changedFiles.flatMap(
    (file) => reviewPatterns.filter((pattern) => matchRepoGlob(file, pattern)).map((pattern) => ({ file, pattern }))
  );
  const documentationOnly = changedFiles.length > 0 && changedFiles.every((file) => /(^|\/)(readme[^/]*|docs?\/)|\.md$/i.test(file));
  const testsOnly = changedFiles.length > 0 && changedFiles.every((file) => /(^|\/)(tests?|__tests__)(\/|$)|\.(test|spec)\./i.test(file));
  const directCategory = documentationOnly ? "docs" : testsOnly ? "low_risk_tests" : risk.level === "low" ? "low_risk_code" : void 0;
  const directAllowedByPolicy = Boolean(directCategory) && (loaded.commitPolicy.allow_direct_commit_for ?? []).includes(directCategory);
  const effectiveRisk = reviewMatches.length > 0 && risk.level !== "blocked" ? "high" : risk.level;
  const reasons = [...risk.reasons];
  if (reviewMatches.length) {
    reasons.push(
      ...reviewMatches.map(
        ({ file, pattern }) => `${file} \u547D\u4E2D\u63D0\u4EA4\u5BA1\u6838\u7B56\u7565 ${pattern}\u3002`
      )
    );
  }
  if (loaded.commitPolicy.always_ask_before_commit) {
    reasons.push("\u9879\u76EE\u7B56\u7565\u8981\u6C42\u4EFB\u4F55\u63D0\u4EA4\u524D\u90FD\u5FC5\u987B\u786E\u8BA4\u3002");
  }
  let allowedActions;
  let recommendedAction;
  if (effectiveRisk === "blocked") {
    allowedActions = ["keep_local"];
    recommendedAction = "keep_local";
  } else if (!capabilities.git) {
    allowedActions = ["keep_local", "create_patch"];
    recommendedAction = effectiveRisk === "low" ? "keep_local" : "create_patch";
  } else if (effectiveRisk === "high") {
    allowedActions = ["keep_local", "create_review_request", "create_patch"];
    recommendedAction = "create_review_request";
  } else if (effectiveRisk === "medium") {
    allowedActions = [
      "keep_local",
      ...directAllowedByPolicy ? ["direct_commit"] : [],
      "create_review_request",
      "create_patch"
    ];
    recommendedAction = "keep_local";
  } else {
    allowedActions = [
      "keep_local",
      ...directAllowedByPolicy ? ["direct_commit"] : [],
      "create_review_request",
      "create_patch"
    ];
    recommendedAction = loaded.commitPolicy.default_mode === "keep_local" || !directAllowedByPolicy ? "keep_local" : "direct_commit";
  }
  const descriptions = {
    keep_local: "\u4FDD\u7559\u672C\u5730\u53D8\u66F4\uFF0C\u7EE7\u7EED\u9A8C\u8BC1\u3002",
    direct_commit: "\u7528\u6237\u660E\u786E\u786E\u8BA4\u540E\u521B\u5EFA\u672C\u5730\u63D0\u4EA4\u3002",
    create_review_request: "\u5C06\u53D8\u66F4\u4EA4\u7ED9\u4ED3\u5E93\u5BA1\u6838\u6D41\u7A0B\u3002",
    create_patch: "\u751F\u6210\u4E0D\u4F9D\u8D56\u4EE3\u7801\u6258\u7BA1\u5E73\u53F0\u7684\u53EF\u79FB\u690D\u8865\u4E01\u3002"
  };
  return {
    allowedActions,
    recommendedAction,
    riskLevel: effectiveRisk,
    changedFiles,
    reasons,
    requiredReviewLenses: effectiveRisk === "blocked" || effectiveRisk === "high" ? [
      ...input.task && /auth|oauth|security|permission/i.test(input.task) ? ["security"] : [],
      ...changedFiles.some((file) => file.includes("database/migrations")) ? ["database"] : [],
      "testing"
    ] : effectiveRisk === "medium" ? ["testing"] : [],
    options: Object.keys(descriptions).map((action) => ({
      action,
      available: allowedActions.includes(action),
      reason: descriptions[action]
    }))
  };
}

// src/commands/explain.ts
async function explain(root, target, task = "") {
  if (target === "context") {
    const context = await buildContextPack(root, task);
    return {
      target,
      task,
      selectedMemories: context.relevantMemories.map((item) => ({
        id: item.id,
        source: item.source,
        reason: item.reason
      })),
      selectedSkills: context.relevantSkills.map((item) => ({
        id: item.id,
        source: item.source,
        reason: item.reason
      })),
      selectedFixPatterns: context.recommendedFixPatterns.map((item) => ({
        id: item.id,
        source: item.source,
        reason: item.reason
      })),
      risk: context.risk,
      candidateRule: "\u5019\u9009\u5185\u5BB9\u4EC5\u4F9B\u53C2\u8003\uFF0Ctrusted=false\uFF0C\u4E14\u4E0D\u80FD\u8986\u76D6\u5DF2\u6279\u51C6\u8D44\u4EA7\u3002"
    };
  }
  if (target === "commit-options") {
    return { target, ...await getCommitOptions(root, { task }) };
  }
  const config = await loadConfig(root);
  if (target === "config") {
    return {
      target,
      precedence: [
        "safety_baseline",
        "organization_rules",
        "spec_and_adr",
        "policies",
        "commit_policy",
        "config",
        "AGENTS.md",
        "approved_artifacts",
        "candidates",
        "local_config",
        "AI_inference"
      ],
      effective: config.config
    };
  }
  if (target === "policy") {
    return {
      target,
      protectedFiles: config.protectedFiles.protected_files ?? [],
      dangerousCommands: config.commandPolicy.dangerous_commands ?? [],
      explanation: "\u53D7\u4FDD\u62A4\u6587\u4EF6\u9700\u8981\u5BA1\u6838\u6216\u963B\u6B62\uFF1B\u5371\u9669\u547D\u4EE4\u5C06\u88AB\u963B\u6B62\u3002"
    };
  }
  throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u7684 explain \u76EE\u6807\uFF1A${target}`);
}

// src/mcp/server.ts
import { createInterface } from "node:readline";

// src/core/audit-writer.ts
import path28 from "node:path";
import { randomUUID as randomUUID4 } from "node:crypto";
import { mkdir as mkdir11, writeFile as writeFile11 } from "node:fs/promises";
async function recordTrace(root, input) {
  const loaded = await loadConfig(root);
  const assetRoot = await resolveAssetRoot(root);
  if (loaded.config.audit?.enabled === false) {
    return { command: "record-trace", recorded: false };
  }
  const now = /* @__PURE__ */ new Date();
  const rawOutcomeStatus = input.outcomeStatus ?? input.outcome_status ?? "success";
  if (!["success", "failure", "partial"].includes(String(rawOutcomeStatus))) {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "outcomeStatus \u53EA\u80FD\u662F success\u3001failure \u6216 partial\u3002"
    );
  }
  const outcomeStatus = String(rawOutcomeStatus);
  const auditId = `audit.${now.toISOString().slice(0, 10).replaceAll("-", "")}.${now.toISOString().slice(11, 23).replaceAll(":", "").replace(".", "")}.${randomUUID4()}`;
  let relativeDirectory;
  try {
    relativeDirectory = normalizeRepoPath(
      loaded.config.audit?.write_to ?? relativeAssetPath(assetRoot, "generated", "audits")
    );
  } catch {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      "audit.write_to \u5FC5\u987B\u662F\u4ED3\u5E93\u76F8\u5BF9\u8DEF\u5F84\uFF0C\u4E14\u4E0D\u80FD\u5305\u542B `..`\u3002",
      relativeAssetPath(assetRoot, "config.yaml")
    );
  }
  const relativePath = `${relativeDirectory}/${auditId}.json`;
  const audit = {
    id: auditId,
    created_at: now.toISOString(),
    preflight_id: input.preflightId ?? input.preflight_id ?? null,
    session_id: input.sessionId ?? input.session_id ?? null,
    task: input.task ?? "",
    changed_files: input.changedFiles ?? [],
    used_memories: input.usedMemories ?? [],
    used_skills: input.usedSkills ?? [],
    used_fix_patterns: input.usedFixPatterns ?? [],
    policy_checks: input.policyChecks ?? [],
    risk_result: input.risk ?? null,
    commit_options: input.commitOptions ?? null,
    generated_candidates: input.generatedCandidates ?? [],
    conflict_notes: input.conflictNotes ?? [],
    secret_redaction_note: "\u7591\u4F3C\u654F\u611F\u503C\u5DF2\u8131\u654F\u3002",
    team_shared_assets_used: input.teamSharedAssetsUsed ?? [],
    personal_settings_used: input.personalSettingsUsed ?? [],
    outcome_status: outcomeStatus,
    outcome: input.outcome ?? null
  };
  if (input.dryRun === true) {
    return {
      command: "record-trace",
      recorded: false,
      dryRun: true,
      path: relativePath,
      auditId
    };
  }
  const target = path28.join(root, relativePath);
  await mkdir11(path28.dirname(target), { recursive: true });
  await writeFile11(
    target,
    `${JSON.stringify(redactSecretValues(audit), null, 2)}
`,
    "utf8"
  );
  return {
    command: "record-trace",
    recorded: true,
    path: relativePath,
    auditId
  };
}

// src/core/patch-writer.ts
import path29 from "node:path";
import { execFile as execFile5 } from "node:child_process";
import { promisify as promisify5 } from "node:util";
import { mkdir as mkdir12, writeFile as writeFile12 } from "node:fs/promises";
var execFileAsync5 = promisify5(execFile5);
async function createPatch(root, dryRun = false) {
  const assetRoot = await resolveAssetRoot(root);
  let stdout2;
  try {
    ({ stdout: stdout2 } = await execFileAsync5("git", ["diff", "--binary", "HEAD"], {
      cwd: root,
      maxBuffer: 20 * 1024 * 1024
    }));
  } catch {
    try {
      ({ stdout: stdout2 } = await execFileAsync5("git", ["diff", "--binary"], { cwd: root }));
    } catch {
      throw new CliError("E_WRITE_FAILED", "Git diff \u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u521B\u5EFA\u8865\u4E01\u3002");
    }
  }
  let untrackedFiles = [];
  try {
    const { stdout: untracked } = await execFileAsync5(
      "git",
      ["ls-files", "--others", "--exclude-standard", "-z"],
      { cwd: root }
    );
    untrackedFiles = untracked.split("\0").filter(Boolean);
    const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
    for (const file of untrackedFiles) {
      try {
        await execFileAsync5(
          "git",
          ["diff", "--binary", "--no-index", "--", nullDevice, file],
          { cwd: root, maxBuffer: 20 * 1024 * 1024 }
        );
      } catch (error) {
        const diff = error.stdout;
        if (diff) stdout2 += `${stdout2 && !stdout2.endsWith("\n") ? "\n" : ""}${diff}`;
      }
    }
  } catch {
  }
  const name = `repo-agent_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.patch`;
  const relativePath = relativeAssetPath(assetRoot, "generated", "patches", name);
  if (!dryRun) {
    const target = path29.join(root, relativePath);
    await mkdir12(path29.dirname(target), { recursive: true });
    await writeFile12(target, stdout2, "utf8");
  }
  return {
    dryRun,
    path: relativePath,
    bytes: Buffer.byteLength(stdout2),
    empty: stdout2.length === 0,
    untrackedFiles
  };
}
async function generatePatchSummary(root) {
  try {
    const [{ stdout: stat5 }, { stdout: names }] = await Promise.all([
      execFileAsync5("git", ["diff", "--stat", "HEAD"], { cwd: root }),
      execFileAsync5("git", ["diff", "--name-only", "HEAD"], { cwd: root })
    ]);
    const { stdout: untracked } = await execFileAsync5(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      { cwd: root }
    );
    const changedFiles = [
      ...new Set([...names.split("\n"), ...untracked.split("\n")].filter(Boolean))
    ];
    return {
      changedFiles,
      fileCount: changedFiles.length,
      stat: stat5.trim(),
      generatedPatch: false
    };
  } catch {
    return { changedFiles: [], fileCount: 0, stat: "", generatedPatch: false };
  }
}

// src/core/hook-runtime.ts
import path31 from "node:path";
import { randomUUID as randomUUID6 } from "node:crypto";
import { mkdir as mkdir14, readFile as readFile16, rename as rename4, writeFile as writeFile14 } from "node:fs/promises";

// src/core/observation-manager.ts
import path30 from "node:path";
import { createHash as createHash5, randomUUID as randomUUID5 } from "node:crypto";
import { appendFile as appendFile2, mkdir as mkdir13, readFile as readFile15, writeFile as writeFile13 } from "node:fs/promises";
function compactObservationText(value, maximum) {
  const normalized = value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  if (normalized.length <= maximum) return normalized;
  const draft = normalized.slice(0, Math.max(1, maximum - 1));
  const boundaries = [
    draft.lastIndexOf("\u3002"),
    draft.lastIndexOf("\uFF01"),
    draft.lastIndexOf("\uFF1F"),
    draft.lastIndexOf(". "),
    draft.lastIndexOf("; "),
    draft.lastIndexOf("\uFF1B"),
    draft.lastIndexOf(" ")
  ];
  const boundary = Math.max(...boundaries);
  const safe2 = boundary >= maximum * 0.6 ? draft.slice(0, boundary + 1) : draft;
  return `${safe2.replace(/[[({`*_]+$/g, "").trimEnd()}\u2026`;
}
var compact = compactObservationText;
function projectId(root) {
  return createHash5("sha256").update(path30.resolve(root)).digest("hex").slice(0, 12);
}
function observationFingerprint(input) {
  return createHash5("sha256").update(
    `${input.kind}
${compact(input.trigger, 240).toLowerCase()}
${compact(input.action, 480).toLowerCase()}
${input.scope}`
  ).digest("hex").slice(0, 20);
}
function classify(task, outcome, outcomeStatus) {
  const text = `${task} ${outcome}`.toLowerCase();
  if (/(禁止|不得|must not|security boundary|安全边界)/.test(text)) {
    return "security_boundary";
  }
  if (/(纠正|不要再|应该改为|correction|instead)/.test(text)) return "correction";
  if (outcomeStatus === "failure") return "failed_attempt";
  if (/(约定|convention|必须覆盖|测试映射)/.test(text)) {
    return "project_convention";
  }
  if (/(先.+再|步骤[:：]|step\s+\d|重复执行)/i.test(text)) {
    return "repeated_workflow";
  }
  return "successful_resolution";
}
async function captureObservation(input) {
  const raw = `${input.task}
${input.outcome}`;
  const hasSecret = containsPossibleSecret(raw);
  const trigger = compact(redactSecrets(input.task), 240);
  const action = compact(redactSecrets(input.outcome), 480);
  const observation = {
    version: 1,
    observationId: randomUUID5(),
    projectId: projectId(input.root),
    preflightId: input.preflightId,
    sessionId: input.sessionId,
    observedAt: (/* @__PURE__ */ new Date()).toISOString(),
    kind: classify(input.task, input.outcome, input.outcomeStatus),
    trigger,
    action,
    outcome: input.outcomeStatus,
    scope: "project",
    evidence: {
      changedFiles: input.changedFiles ?? [],
      tests: input.tests ?? [],
      ...input.auditId ? { auditId: input.auditId } : {},
      toolEventIds: input.toolEventIds ?? []
    },
    redactionStatus: hasSecret ? "redacted" : "clean"
  };
  const file = privateAssetPath(
    input.root,
    "observations",
    observation.projectId,
    `${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.jsonl`
  );
  await mkdir13(path30.dirname(file), { recursive: true });
  await appendFile2(file, `${JSON.stringify(observation)}
`, "utf8");
  return observation;
}
async function listObservations(root) {
  const files = (await listFiles(privateAssetPath(root, "observations"))).filter((file) => file.endsWith(".jsonl"));
  const observations = [];
  for (const file of files) {
    for (const line of (await readFile15(file, "utf8")).split("\n").filter(Boolean)) {
      try {
        observations.push(JSON.parse(line));
      } catch {
      }
    }
  }
  return observations;
}
async function analyzeObservations(root) {
  const growth = (await loadConfig(root)).config.automatic_growth_policy;
  const requiredPreflights = growth?.validated_preflights ?? 3;
  const requiredDays = growth?.validated_days ?? 2;
  const observations = await listObservations(root);
  const groups = /* @__PURE__ */ new Map();
  for (const item of observations) {
    const match2 = [...groups.entries()].find(
      ([, values]) => observationSimilarity(values[0], item) >= 0.82
    );
    const key = match2?.[0] ?? observationFingerprint(item);
    groups.set(key, [...groups.get(key) ?? [], item]);
  }
  return [...groups.entries()].map(([fingerprint, items]) => {
    const distinctPreflights = new Set(items.map((item) => item.preflightId)).size;
    const distinctDays = new Set(items.map((item) => item.observedAt.slice(0, 10))).size;
    const hasEvidence = items.some(
      (item) => item.evidence.changedFiles.length > 0 || item.evidence.tests.length > 0 || Boolean(item.evidence.auditId)
    );
    return {
      fingerprint,
      observations: items,
      distinctPreflights,
      distinctDays,
      status: distinctPreflights >= requiredPreflights && distinctDays >= requiredDays ? hasEvidence ? "team_proposed" : "validated" : "candidate"
    };
  });
}
function observationSimilarity(left, right) {
  const words = (value) => new Set(value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  const ngrams = (value) => {
    const values = /* @__PURE__ */ new Set();
    for (const [sequence] of value.matchAll(/[\p{Script=Han}]{2,}/gu)) {
      const characters = [...sequence];
      for (const size of [2, 3]) {
        for (let index = 0; index <= characters.length - size; index += 1) {
          values.add(characters.slice(index, index + size).join(""));
        }
      }
    }
    return values;
  };
  const jaccard = (a, b) => {
    const union = /* @__PURE__ */ new Set([...a, ...b]);
    if (!union.size) return 0;
    return [...a].filter((item) => b.has(item)).length / union.size;
  };
  const leftText = `${left.trigger} ${left.action}`;
  const rightText = `${right.trigger} ${right.action}`;
  const lexical = jaccard(words(leftText), words(rightText));
  const leftNgrams = ngrams(leftText);
  const rightNgrams = ngrams(rightText);
  const cjk = jaccard(leftNgrams, rightNgrams);
  const structure = (left.kind === right.kind ? 0.6 : 0) + (left.scope === right.scope ? 0.4 : 0);
  const cjkAvailable = leftNgrams.size > 0 && rightNgrams.size > 0;
  const weighted = 0.4 * lexical + (cjkAvailable ? 0.3 * cjk : 0) + 0.2 * structure;
  return weighted / (cjkAvailable ? 0.9 : 0.6);
}
async function materializeObservationCandidates(root, dryRun = false) {
  const groups = await analyzeObservations(root);
  const results = [];
  for (const group of groups) {
    const first = group.observations[0];
    const kind = first.kind === "failed_attempt" ? "fix_pattern" : first.kind === "repeated_workflow" ? "skill" : "memory";
    const prefix = kind === "fix_pattern" ? "fix" : kind;
    const id = `${prefix}.learned.${group.fingerprint}`;
    const value = [
      `\u89E6\u53D1\uFF1A${first.trigger}`,
      `\u884C\u52A8\uFF1A${first.action}`,
      `\u7ED3\u679C\uFF1A${first.outcome}`
    ].join("\n");
    const existing = (await listCandidates(root, kind)).find(
      ({ visibility, candidate: candidate2 }) => visibility === "private" && candidate2.id === id
    );
    if (dryRun) {
      results.push({ id, kind, status: group.status, wouldWrite: !existing });
      continue;
    }
    let source;
    let candidate;
    if (existing) {
      source = existing.source;
      candidate = existing.candidate;
    } else {
      try {
        const proposed = await proposeCandidate({
          root,
          kind,
          id,
          value,
          task: first.trigger,
          proposedBy: "repo-agent-learning",
          visibility: "private"
        });
        source = proposed.path;
        candidate = proposed.candidate;
        if (candidate.status === "quarantined") {
          results.push({ id, kind, status: "quarantined", path: source });
          continue;
        }
      } catch (error) {
        results.push({
          id,
          kind,
          status: "quarantined",
          reason: error.message
        });
        continue;
      }
    }
    const preflightIds = [...new Set(group.observations.map((item) => item.preflightId))];
    const observedDates = [...new Set(
      group.observations.map((item) => item.observedAt.slice(0, 10))
    )];
    const currentEvidence = candidate.evidence && typeof candidate.evidence === "object" ? candidate.evidence : {};
    const updated = {
      ...candidate,
      status: group.status === "candidate" ? "candidate" : "validated",
      evidence: {
        ...currentEvidence,
        occurrences: group.observations.length,
        preflight_ids: preflightIds,
        observed_dates: observedDates,
        changed_files: [...new Set(group.observations.flatMap((item) => item.evidence.changedFiles))],
        tests: [...new Set(group.observations.flatMap((item) => item.evidence.tests))],
        audit_ids: [...new Set(group.observations.map((item) => item.evidence.auditId).filter(Boolean))]
      },
      promotion_eligible: group.status === "team_proposed",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    await writeFile13(path30.join(root, source), stringifyYaml(updated), "utf8");
    results.push({ id, kind, status: updated.status, path: source });
  }
  return { command: "learning-analyze", dryRun, groups: results };
}
async function runBackgroundLearningIfDue(root, force = false, dryRun = false) {
  const growth = (await loadConfig(root)).config.automatic_growth_policy;
  if (!force && growth?.enabled === false) {
    return {
      command: "learning-analyze",
      analyzed: false,
      reason: "\u540E\u53F0\u5B66\u4E60\u5DF2\u7981\u7528\u3002"
    };
  }
  const observationThreshold = growth?.background_observation_threshold ?? 20;
  const maximumAgeHours = growth?.background_max_age_hours ?? 24;
  const marker = privateAssetPath(root, "learning", "last-analysis.json");
  const observations = await listObservations(root);
  let lastCount = 0;
  if (await exists(marker)) {
    try {
      const value = JSON.parse(await readFile15(marker, "utf8"));
      lastCount = value.observationCount ?? 0;
    } catch {
    }
  }
  const dueByCount = observations.length - lastCount >= observationThreshold;
  const pendingObservations = observations.slice(lastCount);
  const oldestPendingAt = Math.min(
    ...pendingObservations.map((item) => Date.parse(item.observedAt)).filter(Number.isFinite)
  );
  const dueByAge = pendingObservations.length > 0 && Number.isFinite(oldestPendingAt) && Date.now() - oldestPendingAt >= maximumAgeHours * 36e5;
  if (!force && !dueByCount && !dueByAge) {
    return { command: "learning-analyze", analyzed: false, reason: "\u5C1A\u672A\u8FBE\u5230\u540E\u53F0\u5206\u6790\u9608\u503C\u3002" };
  }
  const result = await materializeObservationCandidates(root, dryRun);
  if (!dryRun) {
    await mkdir13(path30.dirname(marker), { recursive: true });
    await writeFile13(marker, `${JSON.stringify({
      version: 1,
      analyzedAt: (/* @__PURE__ */ new Date()).toISOString(),
      observationCount: observations.length
    }, null, 2)}
`, "utf8");
  }
  return { ...result, analyzed: true };
}

// src/core/hook-runtime.ts
function safeId(value, fallback) {
  const normalized = value?.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return normalized || fallback;
}
function runtimeRoot2(root) {
  return path31.join(root, ".repo-agent-runtime");
}
async function writeJsonAtomic(file, value) {
  await mkdir14(path31.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID6()}.tmp`;
  await writeFile14(temporary, `${JSON.stringify(value, null, 2)}
`, "utf8");
  await rename4(temporary, file);
}
function hookContext(record, route, closureRoute) {
  const pack = record.contextPack;
  const sources = new Set(route.context_sources);
  const summary = {};
  if (sources.has("instructions")) summary.instructions = pack.relevantInstructions.length;
  if (sources.has("memories")) summary.memories = pack.relevantMemories.length;
  if (sources.has("skills")) summary.skills = pack.relevantSkills.length;
  if (sources.has("fix_patterns")) summary.fixPatterns = pack.recommendedFixPatterns.length;
  if (sources.has("candidates")) summary.candidates = pack.candidateSuggestions.length;
  if (sources.has("recurring_errors")) {
    summary.recurringErrors = pack.recurringErrorRecommendations.length;
  }
  const sourceLine = Object.keys(summary).length ? Object.entries(summary).map(([key, value]) => `${key}=${value}`).join(", ") : "\u65E0";
  return [
    `repo-agent preflight: ${record.id}`,
    `Hook Router: ${route.handler}`,
    `\u98CE\u9669\u7B49\u7EA7: ${pack.risk.level}`,
    `\u5FC5\u987B\u6267\u884C: ${pack.risk.requiredActions.join(", ") || "\u65E0"}`,
    `\u63A8\u8350\u6D4B\u8BD5: ${pack.recommendedTests.join(", ") || "\u672A\u68C0\u6D4B\u5230"}`,
    `\u95ED\u73AF\u6D3B\u52A8: ${closureRoute.closure_steps.join(", ")}`,
    `\u4F1A\u8BDD\u6807\u8BC6: ${record.sessionId}\uFF1Bpreflight \u6807\u8BC6: ${record.id}\u3002\u6267\u884C\u95ED\u73AF\u6D3B\u52A8\u65F6\u4F20\u5165 sessionId\u3002`,
    `\u5DF2\u6CE8\u5165\u4E0A\u4E0B\u6587\u6765\u6E90: ${sourceLine}\uFF08\u8BE6\u60C5\u8BF7\u901A\u8FC7 MCP get_latest_preflight \u67E5\u8BE2\uFF09\u3002`,
    "\u4FEE\u6539\u524D\u5FC5\u987B\u9075\u5FAA\u4EE5\u4E0B\u53EF\u4FE1\u6CBB\u7406\u4E0A\u4E0B\u6587\uFF1A",
    "\uFF08\u5DF2\u7701\u7565\u660E\u7EC6\u4EE5\u63A7\u5236\u63D0\u793A\u8BCD\u9884\u7B97\uFF1B\u8C03\u7528 get_latest_preflight \u83B7\u53D6\u5B8C\u6574 ContextPack\u3002\uFF09"
  ].join("\n");
}
function nativeOutput(eventName, additionalContext) {
  return {
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext
    }
  };
}
async function readLatestPreflight(root, sessionId) {
  const session = safeId(sessionId, "manual");
  const pointer = path31.join(runtimeRoot2(root), "preflights", "sessions", session, "latest.json");
  if (!await exists(pointer)) return null;
  return JSON.parse(await readFile16(pointer, "utf8"));
}
async function recordRuntimeActivity(root, sessionId, activity) {
  const session = safeId(sessionId, "manual");
  const latest = await readLatestPreflight(root, session);
  const preflightId = safeId(latest?.id, "unscoped");
  await writeJsonAtomic(
    path31.join(
      runtimeRoot2(root),
      "sessions",
      session,
      "activities",
      preflightId,
      `${activity}.${Date.now()}.${randomUUID6()}.json`
    ),
    {
      activity,
      sessionId: session,
      preflightId: latest?.id ?? null,
      turnId: latest?.turnId ?? null,
      recordedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  );
  if (latest) {
    const step = activity === "get_commit_options" ? "commit_advice" : "audit_recorded";
    await markClosureStep({
      root,
      sessionId: session,
      turnId: latest.turnId,
      preflightId: latest.id,
      step,
      producer: "mcp",
      payload: { legacyActivity: activity }
    });
  }
}
async function runHook(options) {
  const sessionId = safeId(options.input.session_id, `manual-${randomUUID6()}`);
  const turnId = safeId(options.input.turn_id, randomUUID6());
  const routes = await loadHookRoutes(options.root);
  const route = routes.routes[options.event];
  if (route.handler === "session_handshake") {
    await abandonExpiredClosures(options.root);
    const pending = await readLatestPreflight(options.root, sessionId);
    if (pending) {
      const receipt = await readClosureReceipt(
        options.root,
        pending.sessionId,
        pending.id
      );
      if (receipt && receipt.status !== "closed" && receipt.status !== "abandoned") {
        await runHook({
          root: options.root,
          tool: pending.tool,
          event: "stop",
          input: {
            session_id: pending.sessionId,
            turn_id: pending.turnId,
            stop_hook_active: true,
            last_assistant_message: "SessionStart \u81EA\u52A8\u6062\u590D\u4E0A\u4E00\u8F6E\u672A\u5B8C\u6210\u95ED\u73AF\u3002",
            outcome_status: "partial"
          }
        });
      }
    }
    const state = await handshake({
      root: options.root,
      tool: options.tool,
      hook: "session-start"
    });
    await writeJsonAtomic(
      path31.join(runtimeRoot2(options.root), "tools", `${options.tool}.json`),
      {
        version: 1,
        tool: options.tool,
        sessionId,
        observedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: state.status
      }
    );
    return nativeOutput(
      "SessionStart",
      state.status === "active" ? "repo-agent \u63A5\u5165\u72B6\u6001\uFF1Aactive\u3002\u4EFB\u52A1\u5F00\u59CB\u65F6\u6CBB\u7406 preflight \u5C06\u81EA\u52A8\u6CE8\u5165\u3002" : `repo-agent \u63A5\u5165\u72B6\u6001\uFF1A${state.status}\u3002\u8BF7\u5148\u5B8C\u6210\u521D\u59CB\u5316\u6216\u4FEE\u590D\u63A5\u5165\uFF0C\u518D\u5F00\u59CB\u6CBB\u7406\u4EFB\u52A1\u3002`
    );
  }
  if (route.handler === "tool_policy") {
    const command = typeof options.input.tool_input?.command === "string" ? options.input.tool_input.command : void 0;
    const candidatePath = options.input.tool_input?.file_path ?? options.input.tool_input?.path;
    const paths = typeof candidatePath === "string" ? [candidatePath] : [];
    const policy = await checkPolicy(options.root, {
      command,
      paths,
      toolId: options.input.tool_name
    });
    const latest2 = await readLatestPreflight(options.root, sessionId);
    if (latest2) {
      await appendRuntimeEvent(options.root, {
        eventType: policy.blocked ? "tool_blocked" : "tool_allowed",
        sessionId,
        turnId: latest2.turnId,
        preflightId: latest2.id,
        producer: "hook",
        idempotencyKey: `${latest2.id}:tool:${String(options.input.tool_name ?? "unknown")}:${randomUUID6()}`,
        payload: {
          toolName: options.input.tool_name ?? null,
          blocked: policy.blocked,
          requiresReview: policy.requiresReview,
          reasons: policy.reasons
        }
      });
    }
    if (policy.blocked) {
      return {
        decision: "block",
        reason: policy.reasons.join(" ")
      };
    }
    if (policy.requiresReview && options.tool === "claude-code") {
      return {
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "ask",
          permissionDecisionReason: policy.reasons.join(" ")
        }
      };
    }
    return nativeOutput(
      "PreToolUse",
      policy.requiresReview ? `repo-agent\uFF1A\u8BE5\u5DE5\u5177\u8C03\u7528\u4EA4\u7531\u5BA2\u6237\u7AEF\u539F\u751F\u5BA1\u6279\u7B56\u7565\u5904\u7406\u3002${policy.reasons.join(" ")}` : "repo-agent\uFF1A\u5DE5\u5177\u8C03\u7528\u672A\u547D\u4E2D\u963B\u6B62\u7B56\u7565\u3002"
    );
  }
  if (route.handler === "task_preflight") {
    const pending = await readLatestPreflight(options.root, sessionId);
    if (pending) {
      const receipt = await readClosureReceipt(
        options.root,
        pending.sessionId,
        pending.id
      );
      if (receipt && receipt.status !== "closed" && receipt.status !== "abandoned") {
        await runHook({
          root: options.root,
          tool: pending.tool,
          event: "stop",
          input: {
            session_id: pending.sessionId,
            turn_id: pending.turnId,
            stop_hook_active: true,
            last_assistant_message: "\u65B0\u4EFB\u52A1\u5F00\u59CB\u524D\u81EA\u52A8\u6062\u590D\u4E0A\u4E00\u8F6E\u672A\u5B8C\u6210\u95ED\u73AF\u3002",
            outcome_status: "partial"
          }
        });
      }
    }
    const task = options.task ?? (typeof options.input.prompt === "string" ? options.input.prompt : "");
    if (!task.trim()) {
      return {
        decision: "block",
        reason: "repo-agent\uFF1AUserPromptSubmit hook \u7F3A\u5C11 prompt\uFF0C\u65E0\u6CD5\u751F\u6210 preflight\u3002"
      };
    }
    const id = `preflight.${Date.now()}.${options.tool}.${randomUUID6()}`;
    const contextPack = await buildContextPack(options.root, task, {
      tool: options.tool,
      sessionId,
      turnId,
      preflightId: id,
      hook: true
    });
    const record = {
      version: 1,
      id,
      tool: options.tool,
      sessionId,
      turnId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      task,
      contextPack
    };
    const file = path31.join(runtimeRoot2(options.root), "preflights", `${id}.json`);
    await writeJsonAtomic(file, record);
    await writeJsonAtomic(
      path31.join(runtimeRoot2(options.root), "preflights", "sessions", sessionId, "latest.json"),
      record
    );
    await openClosure({
      root: options.root,
      sessionId,
      turnId,
      preflightId: id,
      openedAt: record.createdAt
    });
    await appendRuntimeEvent(options.root, {
      eventType: "preflight_opened",
      sessionId,
      turnId,
      preflightId: id,
      producer: "hook",
      idempotencyKey: `${id}:preflight_opened`,
      payload: { task, tool: options.tool, risk: contextPack.risk.level }
    });
    await appendRuntimeEvent(options.root, {
      eventType: "context_built",
      sessionId,
      turnId,
      preflightId: id,
      producer: "hook",
      idempotencyKey: `${id}:context_built`,
      payload: {
        trustedAssetIds: contextPack.trustedAssets.map((item) => item.id).filter(Boolean),
        advisoryIds: contextPack.untrustedAdvisories.map((item) => item.id).filter(Boolean),
        estimatedTokens: contextPack.contextBudget.estimatedTokens
      }
    });
    await appendEvidence(
      options.root,
      [...contextPack.trustedAssets, ...contextPack.untrustedAdvisories].map((item) => item.id).filter((assetId) => Boolean(assetId)).map((assetId) => ({
        assetId,
        preflightId: id,
        sessionId,
        type: "retrieved",
        outcomeSource: "agent",
        confidence: 0.5
      }))
    );
    if (route.block_on_risk.includes(contextPack.risk.level)) {
      return {
        decision: "block",
        reason: contextPack.risk.reasons.join(" ")
      };
    }
    return nativeOutput(
      "UserPromptSubmit",
      hookContext(record, route, routes.routes.stop)
    );
  }
  const latest = await readLatestPreflight(options.root, sessionId);
  if (!latest) {
    const message = "repo-agent\uFF1A\u672C\u8F6E\u672A\u53D1\u73B0\u5173\u8054 preflight\uFF0C\u8BF7\u68C0\u67E5 Hook \u63A5\u5165\u72B6\u6001\u3002";
    return options.input.stop_hook_active ? { systemMessage: message } : { decision: "block", reason: message };
  }
  if (options.input.turn_id && safeId(options.input.turn_id, "") !== latest.turnId || options.input.preflight_id && safeId(options.input.preflight_id, "") !== latest.id || latest.sessionId !== sessionId) {
    const message = "repo-agent\uFF1ASession\u3001Turn \u6216 Preflight \u6807\u8BC6\u4E0D\u4E00\u81F4\uFF0C\u5DF2 Fail Closed\u3002";
    return options.input.stop_hook_active ? { systemMessage: message } : { decision: "block", reason: message };
  }
  const outcome = typeof options.input.last_assistant_message === "string" ? options.input.last_assistant_message : "\u4EFB\u52A1\u8F6E\u6B21\u7ED3\u675F\uFF0C\u672A\u63D0\u4F9B\u6700\u7EC8\u7ED3\u679C\u6458\u8981\u3002";
  const outcomeStatus = ["success", "failure", "partial"].includes(
    String(options.input.outcome_status)
  ) ? options.input.outcome_status : "partial";
  let commitOptions;
  let auditId;
  const credited = (items) => items.map((item) => item.id).filter((id) => Boolean(id));
  try {
    const closure = await ensureClosure({
      root: options.root,
      sessionId,
      turnId: latest.turnId,
      preflightId: latest.id,
      producer: "hook",
      handlers: {
        commit_advice: async () => {
          commitOptions = await getCommitOptions(options.root, {
            task: latest.task
          });
          return { recommendedAction: commitOptions.recommendedAction };
        },
        audit_recorded: async () => {
          commitOptions ??= await getCommitOptions(options.root, {
            task: latest.task
          });
          const audit = await recordTrace(options.root, {
            task: latest.task,
            outcome,
            outcomeStatus,
            commitOptions,
            usedMemories: credited(latest.contextPack.relevantMemories),
            usedSkills: credited(latest.contextPack.relevantSkills),
            usedFixPatterns: credited(
              latest.contextPack.recommendedFixPatterns
            ),
            sessionId,
            preflightId: latest.id
          });
          auditId = audit.auditId;
          return { auditId: audit.auditId ?? null };
        },
        observation_captured: async () => {
          const observation = await captureObservation({
            root: options.root,
            preflightId: latest.id,
            sessionId,
            task: latest.task,
            outcome,
            outcomeStatus,
            changedFiles: commitOptions?.changedFiles,
            tests: latest.contextPack.recommendedTests,
            auditId
          });
          return { observationId: observation.observationId };
        },
        recurring_analyzed: async () => {
          const result = await analyzeRecurringErrors(options.root);
          return { signals: result.signals.length };
        },
        lifecycle_evaluated: async () => {
          const learning = await runBackgroundLearningIfDue(options.root);
          const result = await maintainAssets(options.root);
          return {
            transitions: result.transitions.length,
            sharedAssetsDeleted: result.sharedAssetsDeleted,
            learningAnalyzed: learning.analyzed
          };
        },
        metrics_updated: async () => {
          await writeRuntimeSnapshot(options.root, "metrics/latest.json", {
            version: 1,
            updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            preflightId: latest.id,
            outcomeStatus
          });
          return { updated: true };
        }
      }
    });
    if (closure.receipt.status !== "closed") {
      const reason = `repo-agent\uFF1A\u672C\u8F6E\u95ED\u73AF\u672A\u5B8C\u6210\uFF1A${closure.failedNow.map((item) => `${item.step}: ${item.message}`).join("; ")}`;
      return options.input.stop_hook_active ? { systemMessage: reason } : { decision: "block", reason };
    }
    const appliedAssetIds = Array.isArray(options.input.used_asset_ids) ? [...new Set(options.input.used_asset_ids.filter((item) => typeof item === "string" && item))] : [];
    if (appliedAssetIds.length) {
      await appendEvidence(options.root, appliedAssetIds.flatMap((assetId) => [
        {
          assetId,
          preflightId: latest.id,
          sessionId,
          type: "applied",
          outcomeSource: "agent",
          confidence: 0.6
        },
        ...outcomeStatus === "partial" ? [] : [{
          assetId,
          preflightId: latest.id,
          sessionId,
          type: outcomeStatus === "success" ? "validated_success" : "validated_failure",
          outcomeSource: "agent",
          confidence: 0.6
        }]
      ]));
    }
    return {
      systemMessage: `repo-agent\uFF1A\u672C\u8F6E preflight=${latest.id}\uFF0C\u95ED\u73AF\u6B65\u9AA4\u5B8C\u6574\uFF1A${closure.receipt.completedSteps.join(", ")}\u3002`
    };
  } catch (error) {
    const reason = `repo-agent\uFF1A\u672C\u8F6E\u95ED\u73AF\u5931\u8D25\uFF1A${error.message}`;
    return options.input.stop_hook_active ? { systemMessage: reason } : { decision: "block", reason };
  }
}
async function recoverLatestClosure(root, sessionId, dryRun = false) {
  const latest = await readLatestPreflight(root, sessionId);
  if (!latest) return { command: "closure-recover", recovered: false, reason: "\u6CA1\u6709\u53EF\u6062\u590D\u7684 Preflight\u3002" };
  const receipt = await readClosureReceipt(root, latest.sessionId, latest.id);
  if (!receipt || receipt.status === "closed" || receipt.status === "abandoned") {
    return { command: "closure-recover", recovered: false, receipt };
  }
  if (dryRun) return { command: "closure-recover", recovered: false, dryRun: true, receipt };
  const result = await runHook({
    root,
    tool: latest.tool,
    event: "stop",
    input: {
      session_id: latest.sessionId,
      turn_id: latest.turnId,
      stop_hook_active: true,
      last_assistant_message: "\u624B\u5DE5\u6062\u590D\u672A\u5B8C\u6210\u95ED\u73AF\u3002",
      outcome_status: "partial"
    }
  });
  return {
    command: "closure-recover",
    recovered: true,
    result,
    receipt: await readClosureReceipt(root, latest.sessionId, latest.id)
  };
}

// src/commands/health.ts
import path32 from "node:path";
import { readFile as readFile17, stat as stat2 } from "node:fs/promises";
import { createHash as createHash6 } from "node:crypto";
async function healthCheck(root, recurringErrors = [], deep = false) {
  const [profile, status, validation, closure, loaded] = await Promise.all([
    scanProject(root),
    getStatus(root),
    validateProject(root, true),
    closureDiagnostics(root),
    loadConfig(root)
  ]);
  const warnings = [];
  const issues = [];
  const addIssue = (severity, code, message) => {
    issues.push({ severity, code, message });
    if (severity !== "advisory") warnings.push(message);
  };
  const good = [];
  if (profile.process.hasAgents) good.push("\u5DF2\u627E\u5230 AGENTS.md");
  if (validation.ok) good.push("\u4E25\u683C\u6821\u9A8C\u901A\u8FC7");
  else {
    addIssue(
      "error",
      "validation_failed",
      `\u4E25\u683C\u6821\u9A8C\u53D1\u73B0 ${validation.errors.length} \u4E2A\u95EE\u9898`
    );
  }
  if (!profile.process.hasSecurity) {
    addIssue("warning", "security_doc_missing", "\u672A\u68C0\u6D4B\u5230 SECURITY.md");
  }
  if (!profile.testCommands.typecheck) {
    addIssue("warning", "typecheck_missing", "\u672A\u68C0\u6D4B\u5230\u7C7B\u578B\u68C0\u67E5\u547D\u4EE4");
  }
  const pending = status.pendingCandidates;
  const pendingTotal = pending.memory + pending.skill + pending.fixPattern;
  if (pendingTotal) {
    addIssue(
      "advisory",
      "candidate_backlog",
      `\u6709 ${pendingTotal} \u4E2A\u5019\u9009\u7B49\u5F85\u5BA1\u6838`
    );
  }
  const now = Date.now();
  const terminalStatuses = /* @__PURE__ */ new Set([
    "closed",
    "retryable_failed",
    "abandoned"
  ]);
  const activeStatuses = /* @__PURE__ */ new Set([
    "opened",
    "executing",
    "closure_pending"
  ]);
  const terminalClosure = (windowMs) => {
    const terminal = closure.receipts.filter(
      (item) => terminalStatuses.has(item.status) && Date.parse(item.openedAt) >= now - windowMs
    );
    const closed = terminal.filter((item) => item.status === "closed").length;
    return {
      rate: terminal.length ? closed / terminal.length : 1,
      total: terminal.length,
      closed
    };
  };
  const activePreflights = closure.receipts.filter(
    (item) => activeStatuses.has(item.status)
  );
  const abandonAfterHours = loaded.config.closure_policy?.abandon_after_hours ?? 24;
  const overduePreflights = activePreflights.filter((item) => {
    const updatedAt = Date.parse(item.updatedAt);
    return Number.isFinite(updatedAt) && now - updatedAt >= abandonAfterHours * 36e5;
  });
  const preflightFiles = deep ? (await listFiles(path32.join(root, ".repo-agent-runtime", "preflights"))).filter((file) => /^preflight\..+\.json$/.test(path32.basename(file))) : [];
  let estimatedTokens = 0;
  let recalledAssets = 0;
  let unrelatedAssets = 0;
  for (const file of preflightFiles) {
    try {
      const value = JSON.parse(await readFile17(file, "utf8"));
      estimatedTokens += value.contextPack?.contextBudget?.estimatedTokens ?? 0;
      const assets = [
        ...value.contextPack?.trustedAssets ?? [],
        ...value.contextPack?.untrustedAdvisories ?? []
      ];
      recalledAssets += assets.length;
      unrelatedAssets += assets.filter((item) => (item.relevanceScore ?? 0) < 0.15).length;
    } catch {
      addIssue(
        "error",
        "preflight_corrupt",
        `\u8FD0\u884C\u65F6 Preflight \u635F\u574F\uFF1A${path32.basename(file)}`
      );
    }
  }
  if (closure.eventWarnings.length) {
    addIssue(
      "error",
      "event_integrity",
      `Event Store \u53D1\u73B0 ${closure.eventWarnings.length} \u4E2A\u5B8C\u6574\u6027\u95EE\u9898`
    );
  }
  const lockFiles = deep ? await listFiles(path32.join(root, ".repo-agent-runtime", "locks")) : [];
  const staleLocks = [];
  for (const file of lockFiles) {
    try {
      if (now - (await stat2(file)).mtimeMs > 6e4) {
        staleLocks.push(path32.relative(root, file).replaceAll("\\", "/"));
      }
    } catch {
    }
  }
  if (staleLocks.length) {
    addIssue(
      "warning",
      "stale_runtime_lock",
      `\u53D1\u73B0 ${staleLocks.length} \u4E2A\u9648\u65E7\u8FD0\u884C\u65F6\u9501`
    );
  }
  const checksumFile = path32.join(root, "repo-agent", "CHECKSUMS.txt");
  const checksumProblems = [];
  if (deep && await exists(checksumFile)) {
    for (const line of (await readFile17(checksumFile, "utf8")).trim().split("\n")) {
      const [expected, relative] = line.split(/  /);
      try {
        const actual = createHash6("sha256").update(await readFile17(path32.join(root, "repo-agent", relative))).digest("hex");
        if (actual !== expected) checksumProblems.push(relative);
      } catch {
        checksumProblems.push(relative);
      }
    }
  }
  if (checksumProblems.length) {
    addIssue(
      "error",
      "checksum_mismatch",
      `\u5B89\u88C5\u5305 Checksum \u53D1\u73B0 ${checksumProblems.length} \u4E2A\u95EE\u9898`
    );
  }
  if (overduePreflights.length) {
    addIssue(
      "warning",
      "closure_overdue",
      `\u53D1\u73B0 ${overduePreflights.length} \u4E2A\u8D85\u8FC7 ${abandonAfterHours} \u5C0F\u65F6\u4ECD\u672A\u95ED\u73AF\u7684 Preflight`
    );
  }
  const completedSteps = closure.receipts.reduce(
    (sum, item) => sum + item.completedSteps.length,
    0
  );
  const failedSteps = closure.receipts.reduce(
    (sum, item) => sum + item.failedSteps.length,
    0
  );
  const closedDurations = closure.receipts.filter((item) => item.status === "closed").map((item) => Date.parse(item.updatedAt) - Date.parse(item.openedAt)).filter((value) => Number.isFinite(value) && value >= 0);
  const evidenceEvents = await readEvidenceEvents(root);
  const evidenceAssetIds = [...new Set(evidenceEvents.map((item) => item.assetId))];
  const evidenceSummaries = evidenceAssetIds.map(
    (assetId) => summarizeAssetEvidence(
      assetId,
      evidenceEvents,
      now,
      loaded.config.evidence_policy?.freshness_half_life_days ?? 180
    )
  );
  const allCandidates = (await Promise.all(
    ["memory", "skill", "fix_pattern"].map(
      (kind) => listCandidates(root, kind)
    )
  )).flat();
  const reviewedCandidates = allCandidates.filter(
    ({ candidate }) => ["approved", "rejected"].includes(String(candidate.status))
  );
  const readTimestamp = async (file, key) => {
    if (!await exists(file)) return null;
    try {
      return JSON.parse(await readFile17(file, "utf8"))[key] ?? null;
    } catch {
      return null;
    }
  };
  const closure24h = terminalClosure(24 * 36e5);
  const closure7d = terminalClosure(7 * 24 * 36e5);
  const score = Math.max(0, 100 - issues.filter((item) => item.severity === "error").length * 20 - issues.filter((item) => item.severity === "warning").length * 8);
  return {
    score,
    good,
    warnings,
    advisories: issues.filter((item) => item.severity === "advisory").map((item) => item.message),
    issues,
    actions: [
      ...pendingTotal ? ["\u5BA1\u6838\u5F85\u5904\u7406\u5019\u9009\u3002"] : [],
      ...!profile.process.hasSecurity ? ["\u8865\u5145 SECURITY.md\u3002"] : [],
      ...!profile.testCommands.typecheck ? ["\u8865\u5145\u7C7B\u578B\u68C0\u67E5\u547D\u4EE4\u3002"] : [],
      ...overduePreflights.length ? ["\u6267\u884C closure recover\uFF0C\u5E76\u68C0\u67E5 Stop Hook \u63A5\u5165\u3002"] : []
    ],
    recurringErrors,
    validation,
    deep,
    metrics: {
      closureRate24h: closure24h.rate,
      closureRate7d: closure7d.rate,
      terminalPreflights24h: closure24h.total,
      terminalPreflights7d: closure7d.total,
      activePreflights: activePreflights.length,
      overduePreflights: overduePreflights.length,
      abandonAfterHours,
      closureSteps: completedSteps,
      closureStepSuccessRate: completedSteps + failedSteps ? completedSteps / (completedSteps + failedSteps) : 1,
      averageClosureDurationMs: closedDurations.length ? closedDurations.reduce((sum, item) => sum + item, 0) / closedDurations.length : 0,
      failedPreflights: closure.counts.retryable_failed ?? 0,
      abandonedPreflights: closure.counts.abandoned ?? 0,
      orphanedPreflights: Math.max(0, preflightFiles.length - closure.receipts.length),
      tokenEstimate: estimatedTokens,
      unrelatedAssetRecallRate: recalledAssets ? unrelatedAssets / recalledAssets : 0,
      candidateMisclassificationRate: reviewedCandidates.length ? reviewedCandidates.filter(({ candidate }) => candidate.status === "rejected").length / reviewedCandidates.length : 0,
      weightSaturationRate: evidenceSummaries.length ? evidenceSummaries.filter((item) => item.lifecycleHealth >= 0.95).length / evidenceSummaries.length : 0,
      privateCandidateBacklog: status.candidateCounts?.private ?? 0,
      teamCandidateBacklog: status.candidateCounts?.team ?? 0,
      lifecycleProposalBacklog: status.lifecycleProposals ?? 0,
      eventIntegrityWarnings: closure.eventWarnings,
      staleLocks,
      checksumProblems,
      versionConsistency: status.versions?.bundle === status.versions?.schema && status.versions?.bundle === status.versions?.template,
      lastLearningAt: await readTimestamp(
        path32.join(root, ".repo-agent-private", "learning", "last-analysis.json"),
        "analyzedAt"
      ),
      lastMaintenanceAt: await readTimestamp(
        path32.join(root, ".repo-agent-private", "lifecycle", "maintenance.json"),
        "generatedAt"
      )
    }
  };
}

// src/mcp/tools.ts
function requiredString(params, name) {
  const value = params[name];
  if (typeof value !== "string" || !value.trim()) {
    throw new CliError("E_INVALID_CANDIDATE", `\u53C2\u6570 ${name} \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\u3002`);
  }
  return value;
}
function stringArray3(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}
async function propose(root, kind, params) {
  const valueName = kind === "memory" ? "content" : kind === "skill" ? "description" : "pattern";
  return proposeCandidate({
    root,
    kind,
    id: requiredString(params, "id"),
    value: requiredString(params, valueName),
    task: typeof params.task === "string" ? params.task : void 0,
    scope: stringArray3(params.scope),
    dryRun: params.dryRun === true
  });
}
var toolHandlers = {
  get_context_pack: (root, params) => buildContextPack(
    root,
    requiredString(params, "task"),
    params.executionEnvironment && typeof params.executionEnvironment === "object" ? params.executionEnvironment : void 0
  ),
  get_latest_preflight: (root, params) => readLatestPreflight(
    root,
    typeof params.sessionId === "string" ? params.sessionId : void 0
  ),
  get_closure_status: (root) => closureDiagnostics(root),
  recover_closure: (root, params) => recoverLatestClosure(
    root,
    typeof params.sessionId === "string" ? params.sessionId : void 0,
    params.dryRun === true
  ),
  get_asset_evidence: (root, params) => explainEvidence(root, requiredString(params, "assetId")),
  search_assets: async (root, params) => {
    const pack = await buildContextPack(root, requiredString(params, "task"));
    return {
      trustedAssets: pack.trustedAssets,
      untrustedAdvisories: pack.untrustedAdvisories
    };
  },
  promote_candidate: (root, params) => promoteCandidate({
    root,
    id: requiredString(params, "candidateId"),
    reviewer: typeof params.reviewer === "string" ? params.reviewer : void 0,
    dryRun: params.dryRun === true
  }),
  get_health_metrics: async (root) => healthCheck(root, await listRecurringErrors(root), true),
  check_policy: (root, params) => checkPolicy(root, {
    paths: stringArray3(params.paths),
    command: typeof params.command === "string" ? params.command : void 0,
    toolId: typeof params.toolId === "string" ? params.toolId : void 0
  }),
  recommend_tests: async (root) => {
    const profile = await scanProject(root);
    return {
      tests: Object.values(profile.testCommands).filter(Boolean),
      warning: profile.testCommands.unit ? null : "\u672A\u68C0\u6D4B\u5230\u6D4B\u8BD5\u547D\u4EE4\u3002"
    };
  },
  get_commit_options: async (root, params) => {
    const result = await getCommitOptions(root, {
      task: typeof params.task === "string" ? params.task : void 0,
      paths: stringArray3(params.paths)
    });
    if (typeof params.sessionId === "string") {
      await recordRuntimeActivity(root, params.sessionId, "get_commit_options");
    }
    return result;
  },
  propose_memory: (root, params) => propose(root, "memory", params),
  propose_skill: (root, params) => propose(root, "skill", params),
  propose_fix_pattern: (root, params) => propose(root, "fix_pattern", params),
  classify_learning: (_root, params) => classifyLearning(
    requiredString(params, "task"),
    requiredString(params, "observation")
  ),
  record_trace: async (root, params) => {
    const result = await recordTrace(root, params);
    if (typeof params.sessionId === "string") {
      await recordRuntimeActivity(root, params.sessionId, "record_trace");
    }
    return result;
  },
  list_skills: (root) => listApproved(root, "skill"),
  list_fix_patterns: (root) => listApproved(root, "fix_pattern"),
  list_recurring_errors: (root) => listRecurringErrors(root),
  analyze_recurring_errors: (root, params) => analyzeRecurringErrors(root, params.dryRun === true),
  recommend_for_recurring_errors: (root, params) => recommendRecurringErrors(root, requiredString(params, "task")),
  propose_fix_pattern_from_recurring_error: (root, params) => proposeFromRecurring(
    root,
    requiredString(params, "id"),
    params.dryRun === true
  ),
  detect_duplicates: async (root) => ({
    duplicates: await detectDuplicateCandidates(root)
  }),
  redact_secrets: (_root, params) => ({
    redacted: redactSecrets(requiredString(params, "input"))
  }),
  resolve_conflicts: async (root) => {
    const localPath = await resolveLocalConfigPath(root);
    const local = await exists(localPath) ? await readYaml(localPath) : {};
    return {
      conflicts: [
        ...localPolicyConflicts(local),
        ...(await detectDuplicateCandidates(root)).map((duplicate) => ({
          type: "candidate_duplicate",
          winner: "manual_review",
          loser: duplicate.sources.join(", "),
          reason: `\u6709\u591A\u4E2A\u5019\u9009\u6307\u5411 ${duplicate.id}\u3002`,
          suggestedAction: "manual_review"
        }))
      ]
    };
  },
  generate_patch_summary: (root) => generatePatchSummary(root)
};
async function invokeTool(root, method, params = {}) {
  const handler = toolHandlers[method];
  if (!handler) {
    throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u7684 MCP \u5DE5\u5177\uFF1A${method}`);
  }
  return handler(root, params);
}

// src/mcp/server.ts
function validateToolInput(name, args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new CliError("E_INVALID_TOOL_INPUT", "\u5DE5\u5177\u53C2\u6570\u5FC5\u987B\u662F\u5BF9\u8C61\u3002");
  }
  const value = args;
  const schema = getRepoAgentTool(name)?.inputSchema;
  if (!schema) throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u5DE5\u5177\uFF1A${name}`);
  const properties = schema.properties;
  const allowed = new Set(Object.keys(properties ?? {}));
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new CliError(
      "E_INVALID_TOOL_INPUT",
      `\u5DE5\u5177 ${name} \u5305\u542B\u672A\u77E5\u53C2\u6570\uFF1A${unknown.join(", ")}`
    );
  }
  for (const required of schema.required ?? []) {
    if (!(required in value) || value[required] === "") {
      throw new CliError("E_INVALID_TOOL_INPUT", `\u5DE5\u5177 ${name} \u7F3A\u5C11\u53C2\u6570\uFF1A${required}`);
    }
  }
  for (const [key, item] of Object.entries(value)) {
    const expected = properties?.[key]?.type;
    if (expected && expected !== typeof item && !(expected === "array" && Array.isArray(item))) {
      throw new CliError("E_INVALID_TOOL_INPUT", `\u5DE5\u5177 ${name} \u53C2\u6570 ${key} \u7C7B\u578B\u9519\u8BEF\u3002`);
    }
  }
  return value;
}
function errorResponse(id, code, message) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}
async function handleRequest(root, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return errorResponse(null, -32600, "\u65E0\u6548\u7684 JSON-RPC \u8BF7\u6C42\u3002");
  }
  const request = value;
  const isNotification = request.id === void 0;
  if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return isNotification ? null : errorResponse(request.id, -32600, "\u65E0\u6548\u7684 JSON-RPC \u8BF7\u6C42\u3002");
  }
  if (isNotification) {
    return null;
  }
  const params = request.params && typeof request.params === "object" ? request.params : {};
  try {
    let result;
    if (request.method === "initialize") {
      const requestedVersion = typeof params.protocolVersion === "string" ? params.protocolVersion : "2025-03-26";
      result = {
        protocolVersion: requestedVersion === "2025-03-26" ? requestedVersion : "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "repo-agent", version: VERSION },
        instructions: "\u5F00\u59CB\u4EFB\u52A1\u65F6\u5148\u8C03\u7528 get_context_pack\uFF0C\u5E76\u9075\u5FAA\u8FD4\u56DE\u7684 Policy\u3001Memory\u3001Skill \u548C\u98CE\u9669\u8981\u6C42\u3002\u4EFB\u52A1\u7ED3\u675F\u65F6\u7531 Stop Hook \u81EA\u52A8\u5B8C\u6210\u63D0\u4EA4\u5EFA\u8BAE\u3001\u8131\u654F\u5BA1\u8BA1\u3001\u5B66\u4E60\u5206\u6D41\u548C\u91CD\u590D\u9519\u8BEF\u5206\u6790\u3002\u4E0D\u5F97\u76F4\u63A5\u4FEE\u6539 approved \u8D44\u4EA7\uFF1B\u65B0\u7ECF\u9A8C\u53EA\u80FD\u751F\u6210 candidate\u3002"
      };
    } else if (request.method === "ping") {
      result = {};
    } else if (request.method === "tools/list") {
      result = {
        tools: REPO_AGENT_TOOLS.map((tool2) => ({
          name: tool2.name,
          description: tool2.description,
          inputSchema: tool2.inputSchema,
          annotations: tool2.annotations
        }))
      };
    } else if (request.method === "tools/call") {
      const name = String(params.name ?? "");
      const args = validateToolInput(name, params.arguments ?? {});
      const toolValue = await invokeTool(root, name, args);
      result = {
        content: [{ type: "text", text: JSON.stringify(toolValue) }],
        structuredContent: toolValue,
        isError: false
      };
    } else {
      return errorResponse(
        request.id,
        -32601,
        `\u672A\u627E\u5230 method\uFF1A${request.method}`
      );
    }
    return { jsonrpc: "2.0", id: request.id, result };
  } catch (error) {
    return errorResponse(
      request.id,
      error instanceof CliError ? -32602 : -32603,
      error instanceof CliError ? `${error.code}: ${error.message}` : error.message
    );
  }
}
async function runMcpServer(root) {
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      process.stdout.write(
        `${JSON.stringify(errorResponse(null, -32700, `JSON \u89E3\u6790\u5931\u8D25\uFF1A${error.message}`))}
`
      );
      continue;
    }
    const values = Array.isArray(parsed) ? parsed : [parsed];
    if (values.length === 0) {
      process.stdout.write(
        `${JSON.stringify(errorResponse(null, -32600, "JSON-RPC \u6279\u8BF7\u6C42\u4E0D\u80FD\u4E3A\u7A7A\u3002"))}
`
      );
      continue;
    }
    const responses = (await Promise.all(values.map((value) => handleRequest(root, value)))).filter((response) => response !== null);
    if (!responses.length) continue;
    process.stdout.write(
      `${JSON.stringify(Array.isArray(parsed) ? responses : responses[0])}
`
    );
  }
}

// src/core/import-planner.ts
import path33 from "node:path";
var fixedSources = [
  "AGENTS.md",
  "CLAUDE.md",
  ".github/copilot-instructions.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "README.md"
];
async function scanImportSources(root) {
  const sources = [];
  for (const relativePath of fixedSources) {
    if (await exists(path33.join(root, relativePath))) sources.push(relativePath);
  }
  for (const directory of ["docs/adr", ".openspec"]) {
    for (const file of await listFiles(path33.join(root, directory))) {
      sources.push(path33.relative(root, file).replaceAll("\\", "/"));
    }
  }
  return sources.filter((source) => !/(^|\/)\.env|\.pem$|\.key$|id_rsa|id_ed25519/i.test(source));
}
async function buildImportPlan(root) {
  const assetRoot = await resolveAssetRoot(root);
  const sources = await scanImportSources(root);
  return sources.map((source) => {
    const policyLike = /security|copilot/i.test(source);
    const slug = source.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      source,
      target: policyLike ? relativeAssetPath(assetRoot, "learning_inbox", `import_policy_${slug}.yaml`) : relativeAssetPath(assetRoot, "memory_candidates", `cand_memory_import_${slug}.yaml`),
      action: policyLike ? "propose_policy_candidate_for_review" : "propose_memory_candidate",
      confidence: policyLike ? 0.68 : 0.74,
      trusted: false
    };
  });
}

// src/utils/project-root.ts
import path34 from "node:path";
import { realpath } from "node:fs/promises";
var projectMarkers = [
  ".repo-agent",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts"
];
async function findProjectRoot(start2) {
  const resolvedStart = await realpath(path34.resolve(start2)).catch(() => path34.resolve(start2));
  let current = resolvedStart;
  let nearestProject;
  while (true) {
    if (await exists(path34.join(current, ".git"))) return current;
    if (!nearestProject) {
      for (const marker of projectMarkers) {
        if (await exists(path34.join(current, marker))) {
          nearestProject = current;
          break;
        }
      }
    }
    const parent = path34.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return nearestProject ?? resolvedStart;
}

// src/commands/upgrade.ts
import path36 from "node:path";
import { createHash as createHash8 } from "node:crypto";
import { execFile as execFile6 } from "node:child_process";
import { promisify as promisify6 } from "node:util";
import {
  cp,
  mkdir as mkdir15,
  readFile as readFile19,
  realpath as realpath3,
  rm as rm2,
  unlink as unlink5,
  writeFile as writeFile15
} from "node:fs/promises";

// src/core/upgrade-package.ts
import path35 from "node:path";
import { createHash as createHash7 } from "node:crypto";
import {
  lstat,
  readFile as readFile18,
  readdir as readdir2,
  realpath as realpath2,
  stat as stat3
} from "node:fs/promises";

// node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var _a2;
var Worker;
var isMarkedAsUntransferable;
try {
  _a2 = require2("worker_threads"), Worker = _a2.Worker, isMarkedAsUntransferable = _a2.isMarkedAsUntransferable;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start2) {
  var b = new u16(31);
  for (var i2 = 0; i2 < 31; ++i2) {
    b[i2] = start2 += 1 << eb[i2 - 1];
  }
  var r = new i32(b[30]);
  for (var i2 = 1; i2 < 30; ++i2) {
    for (var j = b[i2]; j < b[i2 + 1]; ++j) {
      r[j] = j - b[i2] << 5 | i2;
    }
  }
  return { b, r };
};
var _a2 = freb(fleb, 2);
var fl = _a2.b;
var revfl = _a2.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i2 = 0;
  var l = new u16(mb);
  for (; i2 < s; ++i2) {
    if (cd[i2])
      ++l[cd[i2] - 1];
  }
  var le = new u16(mb);
  for (i2 = 1; i2 < mb; ++i2) {
    le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        var sv = i2 << 4 | cd[i2];
        var r_1 = mb - cd[i2];
        var v = le[cd[i2] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i2 = 0; i2 < s; ++i2) {
      if (cd[i2]) {
        co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i2 = 1; i2 < a.length; ++i2) {
    if (a[i2] > m)
      m = a[i2];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i2 = 0; i2 < hcLen; ++i2) {
          clt[clim[i2]] = bits(dat, pos + i2 * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i2 = 0; i2 < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i2++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i2 - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i2++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i2 = sym - 257, b = fleb[i2];
          add = bits(dat, pos, (1 << b) - 1) + fl[i2];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end2 = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end2);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end2; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i2 = 0; ; ) {
    var c = d[i2++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i2 + eb > d.length)
      return { s: r, r: slc(d, i2 - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i2++] & 63) << 12 | (d[i2++] & 63) << 6 | d[i2++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i2++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i2++] & 63) << 6 | d[i2++] & 63);
  }
};
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i2 = 0; i2 < dat.length; i2 += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i2, i2 + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a3 = dutf8(dat), s = _a3.s, r = _a3.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a3 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a3[0], su = _a3[1], off = _a3[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i2 = 0; i2 < c; ++i2) {
    var _a3 = zh(data, o, z), c_2 = _a3[0], sc = _a3[1], su = _a3[2], fn = _a3[3], no = _a3[4], off = _a3[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/core/upgrade-package.ts
var import_yaml15 = __toESM(require_dist(), 1);
var MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;
var MAX_EXPANDED_BYTES = 128 * 1024 * 1024;
var MAX_ENTRIES = 5e3;
function packageError(message, source) {
  return new CliError("E_UPGRADE_PACKAGE_INVALID", message, source);
}
function safePackagePath(input) {
  if (input.includes("\\") || input.includes("\0")) {
    throw packageError(`\u5347\u7EA7\u5305\u5305\u542B\u975E\u6CD5\u8DEF\u5F84\uFF1A${input}`);
  }
  try {
    return normalizeRepoPath(input);
  } catch {
    throw packageError(`\u5347\u7EA7\u5305\u8DEF\u5F84\u8D8A\u754C\uFF1A${input}`);
  }
}
function safeMigrationTarget(input, label) {
  const normalized = safePackagePath(input);
  if (normalized !== ".repo-agent" && !normalized.startsWith(".repo-agent/")) {
    throw packageError(`${label} \u53EA\u80FD\u5199\u5165 .repo-agent/\uFF1A${input}`);
  }
  return normalized;
}
async function listDirectoryFiles(directory, base = directory) {
  const entries = await readdir2(directory, { withFileTypes: true });
  const nested = [];
  for (const entry of entries) {
    const target = path35.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw packageError(`\u5347\u7EA7\u76EE\u5F55\u4E0D\u80FD\u5305\u542B\u7B26\u53F7\u94FE\u63A5\uFF1A${target}`);
    if (entry.isDirectory()) nested.push(...await listDirectoryFiles(target, base));
    else if (entry.isFile()) nested.push(path35.relative(base, target).replaceAll("\\", "/"));
  }
  return nested.sort();
}
async function readDirectoryPackage(source) {
  const direct = path35.resolve(source);
  const directChecksum = path35.join(direct, "CHECKSUMS.txt");
  let root = direct;
  try {
    if (!(await stat3(directChecksum)).isFile()) throw new Error("not a file");
  } catch {
    root = path35.join(direct, "repo-agent");
  }
  const rootReal = await realpath2(root);
  const files = /* @__PURE__ */ new Map();
  for (const relativePath of await listDirectoryFiles(root)) {
    const safe2 = safePackagePath(relativePath);
    const target = path35.join(root, ...safe2.split("/"));
    const targetReal = await realpath2(target);
    if (targetReal !== rootReal && !targetReal.startsWith(`${rootReal}${path35.sep}`)) {
      throw packageError(`\u5347\u7EA7\u76EE\u5F55\u6587\u4EF6\u8D8A\u754C\uFF1A${relativePath}`);
    }
    if (!(await lstat(target)).isFile()) throw packageError(`\u5347\u7EA7\u76EE\u5F55\u6761\u76EE\u4E0D\u662F\u666E\u901A\u6587\u4EF6\uFF1A${relativePath}`);
    files.set(safe2, await readFile18(target));
  }
  return files;
}
async function readZipPackage(source) {
  const archive = await readFile18(source);
  if (archive.byteLength > MAX_ARCHIVE_BYTES) throw packageError("\u5347\u7EA7 ZIP \u8D85\u8FC7 64 MiB \u9650\u5236\u3002", source);
  let entries;
  try {
    entries = unzipSync(archive);
  } catch (error) {
    throw packageError(`\u65E0\u6CD5\u89E3\u538B\u5347\u7EA7 ZIP\uFF1A${error.message}`, source);
  }
  const names = Object.keys(entries);
  if (names.length > MAX_ENTRIES) throw packageError("\u5347\u7EA7 ZIP \u6587\u4EF6\u6570\u91CF\u8D85\u8FC7\u9650\u5236\u3002", source);
  let expandedBytes = 0;
  const files = /* @__PURE__ */ new Map();
  for (const name of names) {
    if (!name.startsWith("repo-agent/")) {
      throw packageError(`\u5347\u7EA7 ZIP \u53EA\u80FD\u5305\u542B repo-agent/ \u9876\u5C42\u76EE\u5F55\uFF1A${name}`, source);
    }
    const relativePath = safePackagePath(name.slice("repo-agent/".length));
    if (!relativePath || relativePath === ".") continue;
    expandedBytes += entries[name].byteLength;
    if (expandedBytes > MAX_EXPANDED_BYTES) throw packageError("\u5347\u7EA7 ZIP \u89E3\u538B\u540E\u8D85\u8FC7 128 MiB \u9650\u5236\u3002", source);
    files.set(relativePath, entries[name]);
  }
  return files;
}
function sha256(content) {
  return createHash7("sha256").update(content).digest("hex");
}
function decode(content, relativePath) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(content);
  } catch {
    throw packageError(`\u5347\u7EA7\u5305\u6587\u672C\u4E0D\u662F\u6709\u6548 UTF-8\uFF1A${relativePath}`);
  }
}
function validateChecksums(files) {
  const checksumFile = files.get("CHECKSUMS.txt");
  if (!checksumFile) throw packageError("\u5347\u7EA7\u5305\u7F3A\u5C11 CHECKSUMS.txt\u3002");
  const expected = /* @__PURE__ */ new Map();
  for (const line of decode(checksumFile, "CHECKSUMS.txt").trim().split(/\r?\n/)) {
    const match2 = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match2) throw packageError(`CHECKSUMS.txt \u884C\u683C\u5F0F\u65E0\u6548\uFF1A${line}`);
    const relativePath = safePackagePath(match2[2]);
    if (expected.has(relativePath)) throw packageError(`CHECKSUMS.txt \u8DEF\u5F84\u91CD\u590D\uFF1A${relativePath}`);
    expected.set(relativePath, match2[1]);
  }
  const packageFiles = [...files.keys()].filter((file) => file !== "CHECKSUMS.txt").sort();
  if (expected.size !== packageFiles.length || packageFiles.some((file) => !expected.has(file))) {
    throw packageError("CHECKSUMS.txt \u5FC5\u987B\u5B8C\u6574\u8986\u76D6\u5347\u7EA7\u5305\u5185\u7684\u6240\u6709\u6587\u4EF6\u3002");
  }
  for (const [relativePath, digest] of expected) {
    const content = files.get(relativePath);
    if (!content || sha256(content) !== digest) {
      throw packageError(`\u5347\u7EA7\u5305\u6587\u4EF6\u6821\u9A8C\u5931\u8D25\uFF1A${relativePath}`);
    }
  }
}
function assertSemver(value, label) {
  if (!/^\d+\.\d+\.\d+$/.test(value)) {
    throw packageError(`${label} \u4E0D\u662F\u6709\u6548\u7248\u672C\u53F7\uFF1A${value}`);
  }
}
function compareVersions(left, right) {
  assertSemver(left, "\u7248\u672C");
  assertSemver(right, "\u7248\u672C");
  const leftParts = left.split("-")[0].split(".").map(Number);
  const rightParts = right.split("-")[0].split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}
function parseManifest(files) {
  const content = files.get("RELEASE-MANIFEST.json");
  if (!content) throw packageError("\u5347\u7EA7\u5305\u7F3A\u5C11 RELEASE-MANIFEST.json\u3002");
  let manifest;
  try {
    manifest = JSON.parse(decode(content, "RELEASE-MANIFEST.json"));
  } catch (error) {
    throw packageError(`RELEASE-MANIFEST.json \u65E0\u6548\uFF1A${error.message}`);
  }
  if (manifest.package_format !== 1 || manifest.upgrade_protocol !== 1) {
    throw packageError("\u5347\u7EA7\u5305\u683C\u5F0F\u6216\u5347\u7EA7\u534F\u8BAE\u4E0D\u53D7\u652F\u6301\u3002");
  }
  assertSemver(manifest.tool_version, "tool_version");
  assertSemver(manifest.minimum_upgrader_version, "minimum_upgrader_version");
  for (const [name, version] of Object.entries(manifest.asset_versions ?? {})) {
    assertSemver(String(version), `asset_versions.${name}`);
  }
  if (!Array.isArray(manifest.migrations)) throw packageError("migrations \u5FC5\u987B\u662F\u6570\u7EC4\u3002");
  return manifest;
}
function parseMigrations(files, manifest) {
  const migrations = [];
  const ids = /* @__PURE__ */ new Set();
  for (const item of manifest.migrations) {
    if (ids.has(item.id)) throw packageError(`migration id \u91CD\u590D\uFF1A${item.id}`);
    ids.add(item.id);
    const migrationPath = safePackagePath(item.file);
    const content = files.get(migrationPath);
    if (!content || sha256(content) !== item.sha256) {
      throw packageError(`migration \u6587\u4EF6\u7F3A\u5931\u6216\u6458\u8981\u4E0D\u5339\u914D\uFF1A${migrationPath}`);
    }
    const migration = (0, import_yaml15.parse)(decode(content, migrationPath));
    if (migration.id !== item.id || migration.from !== item.from || migration.to !== item.to) {
      throw packageError(`migration \u5143\u6570\u636E\u4E0D\u4E00\u81F4\uFF1A${item.id}`);
    }
    assertSemver(migration.from, `${item.id}.from`);
    assertSemver(migration.to, `${item.id}.to`);
    for (const directory of migration.create_dirs ?? []) {
      safeMigrationTarget(directory, "create_dirs");
    }
    for (const file of migration.add_files_if_missing ?? []) {
      safePackagePath(file.source);
      safeMigrationTarget(file.target, "add_files_if_missing.target");
      if (!files.has(file.source)) throw packageError(`migration \u6E90\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${file.source}`);
    }
    for (const proposal of migration.config_defaults ?? []) {
      const configFile = safeMigrationTarget(proposal.file, "config_defaults.file");
      if (![".repo-agent/config.yaml", ".repo-agent/commit_policy.yaml"].includes(configFile)) {
        throw packageError(`config_defaults \u53EA\u80FD\u5EFA\u8BAE config.yaml \u6216 commit_policy.yaml\uFF1A${proposal.file}`);
      }
      if (!/^[A-Za-z0-9_.-]+(?:\.[A-Za-z0-9_.-]+)*$/.test(proposal.path)) {
        throw packageError(`\u914D\u7F6E\u5B57\u6BB5\u8DEF\u5F84\u65E0\u6548\uFF1A${proposal.path}`);
      }
    }
    migrations.push(migration);
  }
  return migrations;
}
function resolveMigrationChain(migrations, from, to) {
  if (from === to) return [];
  const paths = [];
  const visit2 = (version, chain, seen) => {
    if (version === to) {
      paths.push(chain);
      return;
    }
    for (const migration of migrations.filter((item) => item.from === version)) {
      if (seen.has(migration.to) || compareVersions(migration.to, to) > 0) continue;
      visit2(migration.to, [...chain, migration], /* @__PURE__ */ new Set([...seen, migration.to]));
      if (paths.length > 1) return;
    }
  };
  visit2(from, [], /* @__PURE__ */ new Set([from]));
  if (paths.length === 0) throw new CliError("E_UPGRADE_PATH_MISSING", `\u7F3A\u5C11 ${from} \u2192 ${to} \u7684\u8FC1\u79FB\u94FE\u3002`);
  if (paths.length > 1) throw new CliError("E_UPGRADE_PATH_AMBIGUOUS", `\u5B58\u5728\u591A\u6761 ${from} \u2192 ${to} \u8FC1\u79FB\u94FE\u3002`);
  return paths[0];
}
async function loadUpgradePackage(source) {
  const resolved = path35.resolve(source);
  let sourceStat;
  try {
    sourceStat = await stat3(resolved);
  } catch {
    throw packageError(`\u5347\u7EA7\u6765\u6E90\u4E0D\u5B58\u5728\uFF1A${source}`, source);
  }
  const kind = sourceStat.isDirectory() ? "directory" : "zip";
  const files = kind === "directory" ? await readDirectoryPackage(resolved) : await readZipPackage(resolved);
  validateChecksums(files);
  const manifest = parseManifest(files);
  const migrations = parseMigrations(files, manifest);
  return {
    source: resolved,
    kind,
    manifest,
    files,
    migrations,
    read(relativePath) {
      const safe2 = safePackagePath(relativePath);
      const content = files.get(safe2);
      if (!content) throw packageError(`\u5347\u7EA7\u5305\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${safe2}`);
      return content;
    }
  };
}

// src/commands/upgrade.ts
var import_yaml17 = __toESM(require_dist(), 1);
var execFileAsync6 = promisify6(execFile6);
function sha2562(content) {
  return createHash8("sha256").update(content).digest("hex");
}
function currentAssetVersion(lock) {
  const repoAgent = lock.repo_agent ?? {};
  const version = repoAgent.template_version ?? repoAgent.asset_version;
  if (typeof version !== "string") {
    throw new CliError("E_CONFIG_SCHEMA", "lock.yaml \u7F3A\u5C11\u9879\u76EE\u8D44\u4EA7\u7248\u672C\u3002");
  }
  return version;
}
async function loadLock(root) {
  const assetRoot = await resolveAssetRoot(root);
  const lockPath = path36.join(assetRoot.path, "lock.yaml");
  if (!await exists(lockPath)) {
    throw new CliError(
      "E_PROJECT_NOT_INITIALIZED",
      "\u9879\u76EE\u5C1A\u672A\u521D\u59CB\u5316\uFF0C\u65E0\u6CD5\u5347\u7EA7\u3002",
      relativeAssetPath(assetRoot, "lock.yaml")
    );
  }
  return readYaml(lockPath);
}
function nestedValue(value, dottedPath) {
  let current = value;
  for (const part of dottedPath.split(".")) {
    if (!current || typeof current !== "object" || !(part in current)) return void 0;
    current = current[part];
  }
  return current;
}
async function safeTarget(root, relativePath) {
  const normalized = normalizeRepoPath(relativePath);
  const target = path36.join(root, ...normalized.split("/"));
  const rootReal = await realpath3(root);
  let parent = path36.dirname(target);
  while (!await exists(parent)) {
    const next = path36.dirname(parent);
    if (next === parent) break;
    parent = next;
  }
  const parentReal = await realpath3(parent);
  if (parentReal !== rootReal && !parentReal.startsWith(`${rootReal}${path36.sep}`)) {
    throw new CliError("E_UPGRADE_CONFLICT", `\u5347\u7EA7\u76EE\u6807\u7ECF\u8FC7\u7B26\u53F7\u94FE\u63A5\u9003\u9038\u4ED3\u5E93\uFF1A${relativePath}`, relativePath);
  }
  return target;
}
async function governanceChanges(root) {
  const assetRoot = await resolveAssetRoot(root);
  const prefix = `${assetRoot.name}/`;
  if (!await exists(path36.join(root, ".git"))) return [];
  try {
    const { stdout: stdout2 } = await execFileAsync6(
      "git",
      ["status", "--porcelain=v1", "-uall"],
      { cwd: root }
    );
    return stdout2.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).replace(/^"|"$/g, "").replaceAll("\\", "/")).filter(
      (file) => file === "AGENTS.md" || file === ".gitignore" || file.startsWith(prefix) && !file.startsWith(`${prefix}generated/`) && !file.startsWith(`${prefix}catalog/`)
    );
  } catch {
    return [];
  }
}
async function inspectMigrations(root, upgradePackage, migrations) {
  const assetRoot = await resolveAssetRoot(root);
  const activeTarget = (input) => normalizeRepoPath(input);
  const createDirectories = /* @__PURE__ */ new Set();
  const createFiles = [];
  const skippedFiles = [];
  const conflicts = [];
  const configProposals = [];
  const upgradeCandidates = [];
  for (const migration of migrations) {
    for (const directory of migration.create_dirs ?? []) {
      const normalized = activeTarget(directory);
      if (!await exists(await safeTarget(root, normalized))) createDirectories.add(normalized);
    }
    for (const item of migration.add_files_if_missing ?? []) {
      const target = activeTarget(item.target);
      const targetPath = await safeTarget(root, target);
      if (!await exists(targetPath)) {
        createFiles.push(target);
        continue;
      }
      const current = await readFile19(targetPath);
      const incoming = upgradePackage.read(item.source);
      if (sha2562(current) === sha2562(incoming)) skippedFiles.push(target);
      else if (item.category === "skill" || item.category === "fix_pattern") {
        const incomingText = new TextDecoder().decode(incoming);
        if (containsPossibleSecret(incomingText)) {
          conflicts.push({ path: target, reason: "\u65B0\u7248\u5185\u7F6E\u8D44\u4EA7\u7591\u4F3C\u5305\u542B\u654F\u611F\u4FE1\u606F\uFF0C\u62D2\u7EDD\u751F\u6210\u5019\u9009\u3002" });
          continue;
        }
        const artifact = (0, import_yaml17.parse)(incomingText);
        const id = String(artifact.id ?? "");
        if (!id) {
          conflicts.push({ path: target, reason: "\u65B0\u7248\u5185\u7F6E\u8D44\u4EA7\u7F3A\u5C11 id\uFF0C\u65E0\u6CD5\u751F\u6210\u5347\u7EA7\u5019\u9009\u3002" });
          continue;
        }
        const slug = id.replaceAll(".", "_").replace(/[^A-Za-z0-9_-]/g, "_");
        const directory = item.category === "skill" ? relativeAssetPath(assetRoot, "skills", "candidates") : relativeAssetPath(assetRoot, "fix_patterns", "candidates");
        upgradeCandidates.push({
          path: `${directory}/cand_${item.category}_upgrade_${slug}_${migration.to.replaceAll(".", "_")}.yaml`,
          target,
          kind: item.category,
          source: item.source
        });
      } else {
        conflicts.push({ path: target, reason: "\u76EE\u6807\u6587\u4EF6\u5DF2\u5B58\u5728\u4E14\u5185\u5BB9\u4E0D\u540C\uFF0C\u5DF2\u4FDD\u7559\u9879\u76EE\u7248\u672C\u3002" });
      }
    }
    for (const proposal of migration.config_defaults ?? []) {
      const file = activeTarget(proposal.file);
      const filePath = await safeTarget(root, file);
      if (!await exists(filePath)) {
        conflicts.push({ path: file, reason: "\u914D\u7F6E\u6587\u4EF6\u4E0D\u5B58\u5728\uFF0C\u4E0D\u80FD\u81EA\u52A8\u5408\u5E76\u5B57\u6BB5\u3002" });
        continue;
      }
      const current = await readYaml(filePath);
      if (nestedValue(current, proposal.path) === void 0) {
        configProposals.push({ file, path: proposal.path, value: proposal.value });
      }
    }
  }
  return {
    createDirectories: [...createDirectories].sort(),
    createFiles: [...new Set(createFiles)].sort(),
    skippedFiles: [...new Set(skippedFiles)].sort(),
    conflicts,
    configProposals,
    upgradeCandidates
  };
}
async function createUpgradePlan(root, source, action = "plan") {
  const [lock, upgradePackage] = await Promise.all([
    loadLock(root),
    loadUpgradePackage(source)
  ]);
  const currentVersion = currentAssetVersion(lock);
  const targetVersion = upgradePackage.manifest.asset_versions.template;
  if (compareVersions(VERSION, upgradePackage.manifest.minimum_upgrader_version) < 0) {
    throw new CliError(
      "E_UPGRADE_PACKAGE_INVALID",
      `\u5F53\u524D\u5347\u7EA7\u5668 ${VERSION} \u4F4E\u4E8E\u5347\u7EA7\u5305\u8981\u6C42\u7684 ${upgradePackage.manifest.minimum_upgrader_version}\u3002`
    );
  }
  if (compareVersions(targetVersion, currentVersion) < 0) {
    throw new CliError("E_UPGRADE_NOT_AVAILABLE", `\u4E0D\u652F\u6301\u4ECE ${currentVersion} \u964D\u7EA7\u5230 ${targetVersion}\u3002`);
  }
  const upgradeAvailable = compareVersions(targetVersion, currentVersion) > 0;
  const migrations = upgradeAvailable ? resolveMigrationChain(upgradePackage.migrations, currentVersion, targetVersion) : [];
  const inspected = await inspectMigrations(root, upgradePackage, migrations);
  const gitignore = await ensureManagedGitignore(root, true);
  const dirtyGovernanceFiles = await governanceChanges(root);
  const migrationReview = migrations.flatMap((migration) => migration.review_required ?? []);
  const lockUpgrade = lock.upgrade ?? {};
  const pendingReview = Array.isArray(lockUpgrade.pending) ? lockUpgrade.pending.map(String) : [];
  const reviewRequired = inspected.conflicts.length > 0 || inspected.configProposals.length > 0 || inspected.upgradeCandidates.length > 0 || migrationReview.length > 0 || pendingReview.length > 0;
  const warnings = [
    ...dirtyGovernanceFiles.length ? ["\u68C0\u6D4B\u5230\u672A\u63D0\u4EA4\u7684\u6CBB\u7406\u8D44\u4EA7\uFF1B\u5347\u7EA7\u4E0D\u4F1A\u8986\u76D6\u8FD9\u4E9B\u6587\u4EF6\uFF0C\u8BF7\u5728\u5347\u7EA7\u7ED3\u679C\u4E2D\u91CD\u70B9\u5BA1\u6838\u3002"] : [],
    ...reviewRequired ? ["\u90E8\u5206\u5347\u7EA7\u5185\u5BB9\u9700\u8981\u4EBA\u5DE5\u5BA1\u6838\uFF0C\u5DE5\u5177\u53EA\u5E94\u7528\u5B89\u5168\u7684\u589E\u91CF\u53D8\u66F4\u3002"] : [],
    "CHECKSUMS.txt \u53EA\u80FD\u9A8C\u8BC1\u5B8C\u6574\u6027\uFF1B\u5347\u7EA7\u5305\u5E94\u6765\u81EA\u53EF\u4FE1\u53D1\u5E03\u6E20\u9053\u3002"
  ];
  return {
    package: upgradePackage,
    migrations,
    lock,
    plan: {
      ok: true,
      command: "upgrade",
      action,
      source: upgradePackage.source,
      sourceKind: upgradePackage.kind,
      currentVersion,
      targetVersion,
      toolVersion: upgradePackage.manifest.tool_version,
      upgradeAvailable,
      migrationChain: migrations.map((migration) => migration.id),
      ...inspected,
      gitignoreAction: gitignore.action,
      reviewRequired,
      upgradeState: String(lockUpgrade.state ?? (upgradeAvailable ? "available" : "complete")),
      pendingReview,
      dirtyGovernanceFiles,
      warnings
    }
  };
}
function reportText(plan) {
  const lines = (values) => values.map((value) => `- ${value}`).join("\n") || "- \u65E0";
  return `# repo-agent \u5347\u7EA7\u62A5\u544A

## \u7248\u672C

- \u9879\u76EE\u8D44\u4EA7\uFF1A${plan.currentVersion} \u2192 ${plan.targetVersion}
- \u5DE5\u5177\u7248\u672C\uFF1A${plan.toolVersion}
- \u8FD0\u884C ID\uFF1A${plan.runId}

## Migration

${lines(plan.migrationChain)}

## \u65B0\u589E\u76EE\u5F55

${lines(plan.createDirectories)}

## \u65B0\u589E\u6587\u4EF6

${lines(plan.createFiles)}

## \u4FDD\u7559\u7684\u5DF2\u6709\u6587\u4EF6

${lines(plan.skippedFiles)}

## \u914D\u7F6E\u5408\u5E76\u5EFA\u8BAE

${lines(plan.configProposals.map((item) => `${item.file}: ${item.path}`))}

## \u751F\u6210\u7684\u5347\u7EA7\u5019\u9009

${lines(plan.upgradeCandidates.map((item) => item.path))}

## \u51B2\u7A81

${lines(plan.conflicts.map((item) => `${item.path}: ${item.reason}`))}

## Git \u5FFD\u7565\u89C4\u5219

- ${plan.gitignoreAction}

## \u72B6\u6001

- ${plan.reviewRequired ? "\u5B89\u5168\u589E\u91CF\u5DF2\u5E94\u7528\uFF0C\u4ECD\u6709\u5185\u5BB9\u9700\u8981\u4EBA\u5DE5\u5BA1\u6838\u3002" : "\u5347\u7EA7\u5B8C\u6210\u3002"}
`;
}
async function backupFile(root, relativePath) {
  const target = await safeTarget(root, relativePath);
  const fileExists = await exists(target);
  return {
    path: relativePath,
    existed: fileExists,
    contentBase64: fileExists ? (await readFile19(target)).toString("base64") : ""
  };
}
function upgradeCandidateContent(item, upgradePackage, targetVersion, now) {
  const incoming = (0, import_yaml17.parse)(
    new TextDecoder().decode(upgradePackage.read(item.source))
  );
  const id = String(incoming.id);
  const common = {
    id,
    candidate_id: `candidate.${item.kind}.upgrade.${targetVersion.replaceAll(".", "-")}.${id.replaceAll(".", "-")}`,
    status: "candidate",
    trusted: false,
    type: item.kind,
    scope: [item.target],
    evidence: {
      task: `repo-agent ${targetVersion} \u8D44\u4EA7\u5347\u7EA7`,
      source: "upgrade",
      changed_files: [item.target],
      tests: [],
      audit: "",
      review_request: null
    },
    review: {
      required: true,
      reviewers: ["codeowners"],
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      merged_into: null,
      review_request: null
    },
    score: {
      confidence: 1,
      usefulness: 0.5,
      freshness: 1,
      recurrence: 0,
      success_rate: 0,
      final_weight: 0.5
    },
    proposed_by: "repo-agent-upgrade",
    created_at: now
  };
  const specific = item.kind === "skill" ? {
    description: String(incoming.description ?? `\u5347\u7EA7 ${id}`),
    steps: Array.isArray(incoming.steps) ? incoming.steps : [`\u5BA1\u6838 ${id} \u7684\u65B0\u7248\u5185\u5BB9\u3002`]
  } : {
    pattern: Array.isArray(incoming.patterns) ? incoming.patterns.map(String).join("\n") : String(incoming.pattern ?? id),
    recommendation: Array.isArray(incoming.guidance) ? incoming.guidance.map(String).join("\n") : String(incoming.recommendation ?? `\u5BA1\u6838 ${id} \u7684\u65B0\u7248\u5185\u5BB9\u3002`)
  };
  return stringifyYaml({ ...common, ...specific });
}
async function rollbackInMemory(root, createdFiles, backups) {
  for (const item of [...createdFiles].reverse()) {
    const target = await safeTarget(root, item.path);
    if (!await exists(target)) continue;
    if (sha2562(await readFile19(target)) === item.sha256) await unlink5(target);
  }
  for (const backup of [...backups].reverse()) {
    const target = await safeTarget(root, backup.path);
    if (backup.existed) {
      await mkdir15(path36.dirname(target), { recursive: true });
      await writeFile15(target, Buffer.from(backup.contentBase64, "base64"));
    } else if (await exists(target)) {
      await unlink5(target);
    }
  }
}
async function writePackageFiles(upgradePackage, destination) {
  await mkdir15(destination, { recursive: true });
  for (const [relativePath, content] of upgradePackage.files) {
    const target = path36.join(destination, ...normalizeRepoPath(relativePath).split("/"));
    await mkdir15(path36.dirname(target), { recursive: true });
    await writeFile15(target, content);
  }
}
async function stageToolPackage(root, runId, upgradePackage) {
  const version = upgradePackage.manifest.tool_version;
  const stagedRelative = `.repo-agent-runtime/versions/${version}`;
  const stagedRoot = await safeTarget(root, stagedRelative);
  await rm2(stagedRoot, { recursive: true, force: true });
  await writePackageFiles(upgradePackage, stagedRoot);
  const stagedBundle = path36.join(stagedRoot, "repo-agent.bundle.js");
  const { stdout: stdout2 } = await execFileAsync6(process.execPath, [stagedBundle, "--version"], {
    cwd: root
  });
  if (stdout2.trim() !== version) {
    throw new CliError(
      "E_UPGRADE_PACKAGE_INVALID",
      `\u5347\u7EA7\u5305 bundle \u7248\u672C ${stdout2.trim()} \u4E0E\u6E05\u5355\u7248\u672C ${version} \u4E0D\u4E00\u81F4\u3002`
    );
  }
  const toolRoot = path36.join(root, "repo-agent");
  const invokedBundlePath = path36.resolve(process.argv[1] ?? "");
  const invokedBundle = await realpath3(invokedBundlePath).catch(() => invokedBundlePath);
  const toolRootResolved = await realpath3(toolRoot).catch(() => path36.resolve(toolRoot));
  const runningInsideToolRoot = invokedBundle === toolRootResolved || invokedBundle.startsWith(`${toolRootResolved}${path36.sep}`);
  const installedToolExists = await exists(path36.join(toolRoot, "repo-agent.bundle.js"));
  if (!runningInsideToolRoot && !installedToolExists) {
    return {
      switched: false,
      toolRoot: "repo-agent",
      stagedRoot: stagedRelative,
      nextCommand: `node ${stagedRelative}/repo-agent.bundle.js`
    };
  }
  const backupRelative = `.repo-agent-runtime/backups/${runId}/repo-agent`;
  const backupRoot = await safeTarget(root, backupRelative);
  await rm2(backupRoot, { recursive: true, force: true });
  if (await exists(toolRoot)) await cp(toolRoot, backupRoot, { recursive: true, force: true });
  try {
    await writePackageFiles(upgradePackage, toolRoot);
    const switched = await execFileAsync6(
      process.execPath,
      [path36.join(toolRoot, "repo-agent.bundle.js"), "--version"],
      { cwd: root }
    );
    if (switched.stdout.trim() !== version) {
      throw new Error(`\u5207\u6362\u540E\u7684 bundle \u7248\u672C\u4E3A ${switched.stdout.trim()}`);
    }
  } catch (error) {
    if (await exists(backupRoot)) {
      await rm2(toolRoot, { recursive: true, force: true });
      await cp(backupRoot, toolRoot, { recursive: true, force: true });
    }
    throw new CliError("E_WRITE_FAILED", `\u5207\u6362\u65B0\u7248\u5DE5\u5177\u5931\u8D25\uFF1A${error.message}`);
  }
  return {
    switched: true,
    toolRoot: "repo-agent",
    backupRoot: backupRelative,
    stagedRoot: stagedRelative,
    nextCommand: "node repo-agent/repo-agent.bundle.js"
  };
}
async function restoreTool(root, tool2) {
  if (!tool2?.switched || !tool2.backupRoot) return;
  const toolRoot = await safeTarget(root, tool2.toolRoot);
  const backupRoot = await safeTarget(root, tool2.backupRoot);
  if (!await exists(backupRoot)) {
    throw new CliError("E_UPGRADE_ROLLBACK_FAILED", "\u627E\u4E0D\u5230\u65E7\u5DE5\u5177\u5907\u4EFD\uFF0C\u65E0\u6CD5\u56DE\u6EDA\u5DE5\u5177\u7248\u672C\u3002");
  }
  await rm2(toolRoot, { recursive: true, force: true });
  await cp(backupRoot, toolRoot, { recursive: true, force: true });
}
async function applyUpgrade(options) {
  const assetRoot = await resolveAssetRoot(options.root);
  const activeTarget = (input) => normalizeRepoPath(input);
  const prepared = await createUpgradePlan(options.root, options.source, "apply");
  const plan = { ...prepared.plan, dryRun: options.dryRun, applied: false };
  if (!plan.upgradeAvailable) return plan;
  if (options.dryRun) return plan;
  if (!options.confirmed) {
    throw new CliError(
      "E_UPGRADE_CONFIRMATION_REQUIRED",
      "\u5347\u7EA7\u8BA1\u5212\u5DF2\u751F\u6210\uFF1B\u8BF7\u786E\u8BA4\u540E\u91CD\u8BD5\uFF0C\u6216\u4F7F\u7528 --yes\u3002"
    );
  }
  const runId = `${Date.now()}-${plan.currentVersion}-to-${plan.targetVersion}`;
  const reportPath = relativeAssetPath(assetRoot, "generated", "upgrades", runId, "upgrade_report.md");
  const journalPath = relativeAssetPath(assetRoot, "generated", "upgrades", runId, "journal.json");
  const createdFiles = [];
  const backups = await Promise.all([
    backupFile(options.root, ".gitignore"),
    backupFile(options.root, relativeAssetPath(assetRoot, "lock.yaml"))
  ]);
  let tool2;
  try {
    for (const directory of plan.createDirectories) {
      await mkdir15(await safeTarget(options.root, directory), { recursive: true });
    }
    for (const migration of prepared.migrations) {
      for (const item of migration.add_files_if_missing ?? []) {
        const target = activeTarget(item.target);
        if (!plan.createFiles.includes(target)) continue;
        const targetPath = await safeTarget(options.root, target);
        await mkdir15(path36.dirname(targetPath), { recursive: true });
        const content = prepared.package.read(item.source);
        const result = await writeFileExclusive(targetPath, content);
        if (result !== "created") {
          throw new CliError("E_UPGRADE_CONFLICT", `\u5347\u7EA7\u671F\u95F4\u76EE\u6807\u6587\u4EF6\u88AB\u521B\u5EFA\uFF1A${target}`, target);
        }
        createdFiles.push({ path: target, sha256: sha2562(content) });
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const item of plan.upgradeCandidates) {
      const target = await safeTarget(options.root, item.path);
      if (await exists(target)) continue;
      await mkdir15(path36.dirname(target), { recursive: true });
      const content = upgradeCandidateContent(
        item,
        prepared.package,
        plan.targetVersion,
        now
      );
      const result = await writeFileExclusive(target, content);
      if (result !== "created") {
        throw new CliError("E_UPGRADE_CONFLICT", `\u5347\u7EA7\u5019\u9009\u8DEF\u5F84\u5DF2\u5B58\u5728\uFF1A${item.path}`, item.path);
      }
      createdFiles.push({ path: item.path, sha256: sha2562(content) });
    }
    await ensureManagedGitignore(options.root, false);
    const repoAgent = prepared.lock.repo_agent ?? {};
    const appliedMigrations = [
      ...prepared.lock.applied_migrations ?? [],
      ...prepared.migrations.map((migration) => ({
        id: migration.id,
        from: migration.from,
        to: migration.to,
        applied_at: now
      }))
    ];
    const nextLock = {
      ...prepared.lock,
      version: 1,
      repo_agent: {
        ...repoAgent,
        asset_version: plan.targetVersion,
        template_version: prepared.package.manifest.asset_versions.template,
        schema_version: prepared.package.manifest.asset_versions.schema,
        builtin_policy_version: prepared.package.manifest.asset_versions.builtin_policy,
        builtin_skill_version: prepared.package.manifest.asset_versions.builtin_skill,
        builtin_fix_pattern_version: prepared.package.manifest.asset_versions.builtin_fix_pattern
      },
      updated_at: now,
      applied_migrations: appliedMigrations,
      managed_assets: {
        ...prepared.lock.managed_assets ?? {},
        ...Object.fromEntries(createdFiles.map((item) => [
          item.path,
          { installed_version: plan.targetVersion, installed_sha256: item.sha256 }
        ]))
      },
      upgrade: {
        state: plan.reviewRequired ? "pending_review" : "complete",
        target_version: plan.targetVersion,
        pending: [
          ...plan.configProposals.map((item) => `${item.file}:${item.path}`),
          ...plan.conflicts.map((item) => item.path),
          ...plan.upgradeCandidates.map((item) => item.path),
          ...prepared.migrations.flatMap((migration) => migration.review_required ?? [])
        ],
        run_id: runId
      }
    };
    await writeFile15(
      await safeTarget(options.root, relativeAssetPath(assetRoot, "lock.yaml")),
      stringifyYaml(nextLock),
      "utf8"
    );
    const validation = await validateProject(options.root, true);
    if (!validation.ok) {
      throw new CliError(
        "E_UPGRADE_CONFLICT",
        `\u5347\u7EA7\u540E\u4E25\u683C\u9A8C\u8BC1\u5931\u8D25\uFF1A${validation.errors.map((item) => item.message).join(" ")}`
      );
    }
    const finalPlan = {
      ...plan,
      applied: true,
      runId,
      reportPath,
      journalPath,
      upgradeState: plan.reviewRequired ? "pending_review" : "complete",
      pendingReview: [
        ...plan.configProposals.map((item) => `${item.file}:${item.path}`),
        ...plan.conflicts.map((item) => item.path),
        ...plan.upgradeCandidates.map((item) => item.path),
        ...prepared.migrations.flatMap((migration) => migration.review_required ?? [])
      ]
    };
    const reportTarget = await safeTarget(options.root, reportPath);
    await mkdir15(path36.dirname(reportTarget), { recursive: true });
    await writeFile15(reportTarget, reportText(finalPlan), "utf8");
    const stagedTool = await stageToolPackage(
      options.root,
      runId,
      prepared.package
    );
    tool2 = {
      switched: stagedTool.switched,
      toolRoot: stagedTool.toolRoot,
      backupRoot: stagedTool.backupRoot,
      stagedRoot: stagedTool.stagedRoot
    };
    finalPlan.toolStagedPath = stagedTool.stagedRoot;
    finalPlan.toolSwitched = stagedTool.switched;
    finalPlan.nextCommand = stagedTool.nextCommand;
    const journal = {
      runId,
      from: plan.currentVersion,
      to: plan.targetVersion,
      createdFiles,
      backups,
      createdAt: now,
      status: "completed",
      tool: tool2
    };
    await writeFile15(
      await safeTarget(options.root, journalPath),
      `${JSON.stringify(journal, null, 2)}
`,
      "utf8"
    );
    return finalPlan;
  } catch (error) {
    if (tool2?.switched) await restoreTool(options.root, tool2);
    await rollbackInMemory(options.root, createdFiles, backups);
    throw error;
  }
}
async function rollbackUpgrade(root, runId) {
  if (!/^[0-9]+-[0-9A-Za-z.-]+-to-[0-9A-Za-z.-]+$/.test(runId)) {
    throw new CliError("E_UPGRADE_ROLLBACK_FAILED", "\u5347\u7EA7\u8FD0\u884C ID \u65E0\u6548\u3002");
  }
  const assetRoot = await resolveAssetRoot(root);
  const journalPath = relativeAssetPath(assetRoot, "generated", "upgrades", runId, "journal.json");
  const target = await safeTarget(root, journalPath);
  if (!await exists(target)) {
    throw new CliError("E_UPGRADE_ROLLBACK_FAILED", `\u627E\u4E0D\u5230\u5347\u7EA7\u65E5\u5FD7\uFF1A${runId}`);
  }
  const journal = JSON.parse(await readFile19(target, "utf8"));
  if (journal.status !== "completed") {
    throw new CliError("E_UPGRADE_ROLLBACK_FAILED", `\u5347\u7EA7 ${runId} \u5DF2\u56DE\u6EDA\u6216\u72B6\u6001\u65E0\u6548\u3002`);
  }
  for (const item of journal.createdFiles) {
    const file = await safeTarget(root, item.path);
    if (await exists(file) && sha2562(await readFile19(file)) !== item.sha256) {
      throw new CliError(
        "E_UPGRADE_ROLLBACK_FAILED",
        `\u5347\u7EA7\u521B\u5EFA\u7684\u6587\u4EF6\u5DF2\u88AB\u4FEE\u6539\uFF0C\u62D2\u7EDD\u5220\u9664\uFF1A${item.path}`,
        item.path
      );
    }
  }
  await rollbackInMemory(root, journal.createdFiles, journal.backups);
  await restoreTool(root, journal.tool);
  journal.status = "rolled_back";
  await writeFile15(target, `${JSON.stringify(journal, null, 2)}
`, "utf8");
  return {
    ok: true,
    command: "upgrade",
    action: "rollback",
    runId,
    rolledBack: true,
    restoredVersion: journal.from,
    warnings: []
  };
}

// src/cli.ts
import { createInterface as createInterface2 } from "node:readline/promises";
import { stdin, stdout } from "node:process";

// src/commands/update.ts
import path38 from "node:path";
import { readdir as readdir3, readFile as readFile20, stat as stat4 } from "node:fs/promises";

// src/commands/sync.ts
import path37 from "node:path";
async function syncProject(options) {
  const initialized = await exists(
    path37.join(options.root, ".repo-agent", "config.yaml")
  );
  if (!initialized) {
    const result = await initializeProject({
      root: options.root,
      mode: "team",
      dryRun: options.dryRun,
      tool: options.tool,
      entry: options.entry
    });
    return {
      ok: true,
      command: "sync",
      initialized: !options.dryRun,
      initializedNow: !options.dryRun,
      wouldInitialize: options.dryRun,
      repaired: true,
      init: result,
      validation: options.dryRun ? null : await validateProject(options.root, true),
      activation: result.activation,
      warnings: result.warnings
    };
  }
  const validation = await validateProject(options.root, true);
  if (!validation.ok) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      `\u56E2\u961F\u6CBB\u7406\u8D44\u4EA7\u6821\u9A8C\u5931\u8D25\uFF1A${validation.errors.map((issue) => `${issue.path ?? "\u914D\u7F6E"}\uFF1A${issue.message}`).join(" ")}`
    );
  }
  const activation = await activateIntegrations(
    options.root,
    options.tool,
    options.dryRun,
    options.entry
  );
  const gitignore = await ensureManagedGitignore(
    options.root,
    options.dryRun
  );
  return {
    ok: true,
    command: "sync",
    initialized: true,
    initializedNow: false,
    wouldInitialize: false,
    repaired: activation.created.length > 0 || activation.updated.length > 0 || gitignore.action === "updated" || gitignore.action === "wouldUpdate",
    validation,
    activation,
    gitignore: { action: gitignore.action },
    warnings: validation.warnings.map((warning) => warning.message)
  };
}

// src/commands/update.ts
var RUN_ID_PATTERN = /^[0-9]+-[0-9A-Za-z.-]+-to-[0-9A-Za-z.-]+$/;
async function autoDetectSource(root) {
  const explicitZip = path38.join(root, "release", "repo-agent-node-offline.zip");
  if (await exists(explicitZip)) return explicitZip;
  const installedTool = path38.join(root, "repo-agent");
  if (await exists(path38.join(installedTool, "repo-agent.bundle.js"))) {
    return installedTool;
  }
  return void 0;
}
async function findLatestRunId(root) {
  const assetRoot = await resolveAssetRoot(root);
  const upgradesDir = path38.join(
    root,
    relativeAssetPath(assetRoot, "generated", "upgrades")
  );
  if (!await exists(upgradesDir)) return void 0;
  const entries = await readdir3(upgradesDir);
  const candidates = [];
  for (const entry of entries) {
    if (!RUN_ID_PATTERN.test(entry)) continue;
    const journalPath = path38.join(upgradesDir, entry, "journal.json");
    if (!await exists(journalPath)) continue;
    try {
      const raw = JSON.parse(await readFile20(journalPath, "utf8"));
      if (raw.status !== "completed") continue;
      const info = await stat4(journalPath);
      candidates.push({ runId: entry, mtimeMs: info.mtimeMs });
    } catch {
      continue;
    }
  }
  if (!candidates.length) return void 0;
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0].runId;
}
async function runUpdate(options) {
  if (options.rollback) {
    let runId = options.rollbackRunId;
    if (!runId) runId = await findLatestRunId(options.root);
    if (!runId) {
      throw new CliError(
        "E_UPGRADE_ROLLBACK_FAILED",
        "\u672A\u627E\u5230\u53EF\u56DE\u6EDA\u7684\u5347\u7EA7\u65E5\u5FD7\u3002"
      );
    }
    const result = await rollbackUpgrade(options.root, runId);
    return { ...result, command: "update", action: "rollback" };
  }
  const initialized = await exists(
    path38.join(options.root, ".repo-agent", "config.yaml")
  );
  const explicitSource = options.source;
  const source = explicitSource ?? (initialized ? await autoDetectSource(options.root) : void 0);
  if (initialized && source) {
    const prepared = await createUpgradePlan(options.root, source, "plan");
    if (prepared.plan.upgradeAvailable) {
      const plan = await applyUpgrade({
        root: options.root,
        source,
        dryRun: options.dryRun,
        confirmed: options.confirmed || options.dryRun
      });
      return { ...plan, command: "update", action: "migrate" };
    }
    if (explicitSource) {
      return { ...prepared.plan, command: "update", action: "refresh" };
    }
  }
  const sync = await syncProject({
    root: options.root,
    tool: options.tool,
    entry: options.entry,
    dryRun: options.dryRun
  });
  return {
    ...sync,
    command: "update",
    action: sync.initializedNow || sync.wouldInitialize ? "init" : "refresh"
  };
}

// src/cli.ts
var valueOptions = /* @__PURE__ */ new Set([
  "mode",
  "id",
  "content",
  "description",
  "pattern",
  "task",
  "observation",
  "paths",
  "command",
  "scope",
  "source",
  "tool",
  "entry",
  "session-id",
  "outcome",
  "outcome-status",
  "visibility",
  "merged-into",
  "reviewer"
]);
var toolSelections = [
  "auto",
  "all",
  "codex",
  "claude-code",
  "opencode"
];
function parseArguments(argv) {
  const positionals = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }
    const name = argument.slice(2);
    if (name === "json" || name === "dry-run" || name === "help" || name === "version" || name === "strict" || name === "yes" || name === "repair" || name === "without-secrets" || name === "deep" || name === "rollback") {
      options[name] = true;
      continue;
    }
    if (!valueOptions.has(name)) {
      throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u9009\u9879\uFF1A--${name}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new CliError("E_UNKNOWN_COMMAND", `\u9009\u9879 --${name} \u9700\u8981\u63D0\u4F9B\u503C\u3002`);
    }
    options[name] = value;
    index += 1;
  }
  return { positionals, options };
}
function optionString(parsed, name) {
  const value = parsed.options[name];
  return typeof value === "string" ? value : void 0;
}
function requiredOption(parsed, name) {
  const value = optionString(parsed, name);
  if (!value) throw new CliError("E_INVALID_CANDIDATE", `\u7F3A\u5C11\u5FC5\u586B\u9009\u9879 --${name}\u3002`);
  return value;
}
function commaList(value) {
  return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}
function helpText() {
  return `repo-agent ${VERSION}

P0 \u57FA\u7840\u547D\u4EE4\uFF1A
  repo-agent init [--mode team|personal] [--tool all|codex|claude-code|opencode] [--entry auto|hook|plugin|mcp-only|none] [--dry-run] [--json]
  repo-agent update [--source <zip-or-directory>] [--tool auto|all|codex|claude-code|opencode] [--entry auto|hook|plugin|mcp-only|none] [--dry-run] [--yes] [--rollback [<run-id>]] [--json]
  repo-agent doctor|validate [--json]
  repo-agent context <task> [--json]
  repo-agent commit-options [--task <task>] [--paths <a,b>] [--session-id <id>] [--json]
  repo-agent record-trace --task <task> [--outcome <text>] [--outcome-status success|failure|partial] [--session-id <id>] [--json]

P1 \u5B66\u4E60\u4E0E\u4E0A\u4E0B\u6587\u547D\u4EE4\uFF1A
  repo-agent status [--json]
  repo-agent memory|skill|fix-pattern list-candidates|propose [--visibility private|team]
  repo-agent memory|skill|fix-pattern approve|reject|archive|merge <candidate-id>
  repo-agent learning classify --task <task> --observation <text>
  repo-agent learning analyze [--dry-run]
  repo-agent candidate promote <candidate-id> [--dry-run]
  repo-agent closure status|recover [--session-id <id>] [--dry-run]
  repo-agent evidence explain <asset-id>
  repo-agent lifecycle propose [--dry-run]
  repo-agent lifecycle list
  repo-agent lifecycle apply <proposal-id> [--reviewer <name>] [--dry-run]
  repo-agent lifecycle restore <asset-id> [--dry-run]
  repo-agent explain context <task>

P2 \u6CBB\u7406\u547D\u4EE4\uFF1A
  repo-agent validate --strict --json
  repo-agent health check --json
  repo-agent maintain [--dry-run] [--json]
  repo-agent import scan|plan --json
  repo-agent recurring-errors list|analyze|recommend|propose-fix-pattern
  repo-agent learning inbox|triage
  repo-agent patch create [--dry-run]
  repo-agent mcp stdio

\u5DE5\u5177\u63A5\u5165\uFF1A
  repo-agent handshake [--tool auto|codex|claude-code|opencode]
  repo-agent activate [--repair] [--tool auto|all|codex|claude-code|opencode] [--entry auto|hook|plugin|mcp-only|none]
  repo-agent deactivate [--tool ...]
  repo-agent hook session-start|user-prompt-submit|pre-tool-use|stop --tool codex|claude-code|opencode
`;
}
var riskLabels = {
  low: "\u4F4E",
  medium: "\u4E2D",
  high: "\u9AD8",
  blocked: "\u5DF2\u963B\u6B62"
};
var actionLabels = {
  keep_local: "\u4FDD\u7559\u672C\u5730",
  direct_commit: "\u76F4\u63A5\u63D0\u4EA4",
  create_review_request: "\u521B\u5EFA\u5BA1\u6838\u8BF7\u6C42",
  create_patch: "\u521B\u5EFA\u8865\u4E01"
};
var modeLabels = {
  team: "\u56E2\u961F",
  personal: "\u4E2A\u4EBA"
};
function successPayload(result) {
  if (result && typeof result === "object") {
    const record = result;
    if ("ok" in record) {
      const { ok: _ok, warnings: _warnings, ...data } = record;
      return "data" in record ? record : { ...record, data };
    }
    return {
      ok: true,
      data: record,
      warnings: Array.isArray(record.warnings) ? record.warnings : []
    };
  }
  return { ok: true, data: result, warnings: [] };
}
function printHuman(result) {
  const value = result;
  if (value.command === "update") {
    const action = String(value.action);
    if (action === "rollback") {
      console.log(`repo-agent \u5347\u7EA7\u56DE\u6EDA\u5B8C\u6210\uFF1A${String(value.runId)}`);
      console.log(`\u5DF2\u6062\u590D\u9879\u76EE\u8D44\u4EA7\u7248\u672C\uFF1A${String(value.restoredVersion)}`);
      return;
    }
    if (action === "migrate") {
      console.log("repo-agent \u5347\u7EA7\u7ED3\u679C");
      console.log(`\u9879\u76EE\u8D44\u4EA7\uFF1A${String(value.currentVersion)} \u2192 ${String(value.targetVersion)}`);
      console.log(`\u5347\u7EA7\u5305\u5DE5\u5177\u7248\u672C\uFF1A${String(value.toolVersion)}`);
      if (value.pendingReview.length) {
        console.log(`\u5F85\u4EBA\u5DE5\u5BA1\u6838\uFF1A${value.pendingReview.length} \u9879`);
      }
      for (const migration of value.migrationChain) console.log(`- migration\uFF1A${migration}`);
      for (const directory of value.createDirectories) console.log(`- \u65B0\u589E\u76EE\u5F55\uFF1A${directory}`);
      for (const file of value.createFiles) console.log(`- \u65B0\u589E\u6587\u4EF6\uFF1A${file}`);
      for (const proposal of value.configProposals) {
        console.log(`- \u914D\u7F6E\u5EFA\u8BAE\uFF1A${proposal.file} \u2192 ${proposal.path}`);
      }
      for (const candidate of value.upgradeCandidates) {
        console.log(`- \u5347\u7EA7\u5019\u9009\uFF1A${candidate.path}`);
      }
      for (const conflict of value.conflicts) {
        console.warn(`\u51B2\u7A81\uFF1A${conflict.path}\uFF1A${conflict.reason}`);
      }
      if (value.dryRun) console.log("\u8BD5\u8FD0\u884C\u5B8C\u6210\uFF0C\u672A\u5199\u5165\u4EFB\u4F55\u6587\u4EF6\u3002");
      if (value.applied) {
        console.log(value.reviewRequired ? "\u5B89\u5168\u589E\u91CF\u5DF2\u5E94\u7528\uFF0C\u4ECD\u6709\u5185\u5BB9\u9700\u8981\u4EBA\u5DE5\u5BA1\u6838\u3002" : "\u5347\u7EA7\u5B8C\u6210\u3002");
        if (value.reportPath) console.log(`\u5347\u7EA7\u62A5\u544A\uFF1A${String(value.reportPath)}`);
        if (value.toolSwitched === false && value.nextCommand) {
          console.log(`\u65B0\u7248\u5DE5\u5177\u5DF2\u6682\u5B58\uFF1B\u540E\u7EED\u5165\u53E3\uFF1A${String(value.nextCommand)}`);
        }
      }
      for (const warning of value.warnings) console.warn(`\u8B66\u544A\uFF1A${warning}`);
      return;
    }
    console.log(action === "init" ? "repo-agent \u521D\u59CB\u5316\u5B8C\u6210\u3002" : "repo-agent \u540C\u6B65\u5B8C\u6210\u3002");
    const validation = value.validation;
    if (validation) {
      console.log(`\u56E2\u961F\u8D44\u4EA7\u6821\u9A8C\uFF1A${validation.ok === false ? "\u5931\u8D25" : "\u901A\u8FC7"}`);
    }
    const activation = value.activation;
    if (activation) {
      console.log(
        `\u63A5\u5165\u914D\u7F6E\uFF1A\u65B0\u589E ${activation.created?.length ?? 0} \u9879\uFF0C\u66F4\u65B0 ${activation.updated?.length ?? 0} \u9879\u3002`
      );
      if (activation.reloadRequired) console.log("\u8BF7\u65B0\u5EFA\u5DE5\u5177\u4F1A\u8BDD\u4F7F\u914D\u7F6E\u751F\u6548\u3002");
    }
    for (const warning of value.warnings) console.warn(`\u8B66\u544A\uFF1A${warning}`);
    return;
  }
  if (value.command === "activate" || value.command === "deactivate") {
    console.log(String(value.message));
    if (value.reloadRequired) console.log("\u9700\u8981\u65B0\u5EFA\u4F1A\u8BDD\u6216\u91CD\u65B0\u6253\u5F00\u5F00\u53D1\u5DE5\u5177\uFF1B\u65E0\u9700\u91CD\u542F\u4E1A\u52A1\u9879\u76EE\u3002");
    return;
  }
  if (value.command === "maintain") {
    console.log("repo-agent \u8D44\u4EA7\u751F\u547D\u5468\u671F\u7EF4\u62A4\u5B8C\u6210\u3002");
    console.log(`\u5F85\u5BA1\u6838\u8FC7\u671F\u8D44\u4EA7\uFF1A${value.staleApproved.length} \u9879\u3002`);
    console.log(`\u5DF2\u6E05\u7406\u79C1\u4EBA\u5019\u9009\uFF1A${value.removedPrivateCandidates.length} \u9879\u3002`);
    console.log(`\u5DF2\u6E05\u7406\u79C1\u4EBA Inbox\uFF1A${value.removedPrivateInbox.length} \u9879\u3002`);
    console.log(`\u751F\u547D\u5468\u671F\u8F6C\u6362\uFF1A${value.transitions.length} \u9879\u3002`);
    return;
  }
  if (value.command === "record-trace") {
    console.log(
      value.recorded ? `repo-agent \u5BA1\u8BA1\u5DF2\u8BB0\u5F55\uFF1A${String(value.path)}` : value.dryRun ? `\u8BD5\u8FD0\u884C\uFF1A\u5C06\u5199\u5165\u5BA1\u8BA1 ${String(value.path)}` : "\u9879\u76EE\u914D\u7F6E\u5DF2\u5173\u95ED\u5BA1\u8BA1\u8BB0\u5F55\u3002"
    );
    return;
  }
  if (["approve", "reject", "archive", "merge"].includes(String(value.action)) && value.candidate) {
    console.log(`\u5019\u9009\u8D44\u4EA7\u5BA1\u6838\u5B8C\u6210\uFF1A${String(value.action)}\u3002`);
    console.log(`\u5019\u9009\u6587\u4EF6\uFF1A${String(value.source)}`);
    if (value.approvedPath) console.log(`\u6B63\u5F0F\u8D44\u4EA7\uFF1A${String(value.approvedPath)}`);
    return;
  }
  if (value.command === "handshake") {
    console.log(`repo-agent \u63A5\u5165\u72B6\u6001\uFF1A${String(value.status)}`);
    for (const check of value.checks) {
      console.log(`- ${check.tool}\uFF1A${check.status}`);
    }
    if (value.suggestedCommand) console.log(`\u5EFA\u8BAE\u6267\u884C\uFF1A${String(value.suggestedCommand)}`);
    return;
  }
  if (value.command === "init") {
    const files = value.dryRun ? [...value.wouldCreate, ...value.wouldUpdate] : [...value.created, ...value.updated];
    console.log(`repo-agent \u521D\u59CB\u5316\uFF08${modeLabels[String(value.mode)] ?? String(value.mode)}\u6A21\u5F0F\uFF09`);
    console.log(
      value.dryRun ? "\u8BD5\u8FD0\u884C\uFF1A\u672A\u5199\u5165\u4EFB\u4F55\u6587\u4EF6\u3002" : `\u5DF2\u521B\u5EFA ${value.created.length} \u4E2A\u6587\u4EF6\uFF0C\u66F4\u65B0 ${value.updated.length} \u4E2A\u6587\u4EF6\u3002`
    );
    for (const file of files) console.log(`- ${file}`);
    const activation = value.activation;
    if (!value.dryRun && activation?.message) console.log(activation.message);
    if (!value.dryRun && activation?.reloadRequired) {
      console.log("\u9700\u8981\u65B0\u5EFA\u4F1A\u8BDD\u6216\u91CD\u65B0\u6253\u5F00\u5F00\u53D1\u5DE5\u5177\uFF1B\u65E0\u9700\u91CD\u542F\u4E1A\u52A1\u9879\u76EE\u3002");
    }
    for (const warning of value.warnings) console.warn(`\u8B66\u544A\uFF1A${warning}`);
    return;
  }
  if (value.command === "doctor") {
    console.log(`repo-agent \u73AF\u5883\u68C0\u67E5\uFF1A${value.ok ? "\u901A\u8FC7" : "\u5931\u8D25"}`);
    for (const check of value.checks) {
      console.log(`${check.ok ? "\u2713" : "\u2717"} ${check.message}`);
    }
    return;
  }
  if (value.command === "validate") {
    console.log(`\u914D\u7F6E\u6821\u9A8C\uFF08${value.mode === "strict" ? "\u4E25\u683C\u6A21\u5F0F" : "\u666E\u901A\u6A21\u5F0F"}\uFF09\uFF1A${value.ok ? "\u901A\u8FC7" : "\u5931\u8D25"}`);
    for (const issue of value.errors) {
      console.log(`\u2717 [${issue.code}] ${issue.path ? `${issue.path}\uFF1A` : ""}${issue.message}`);
    }
    for (const warning of value.warnings) {
      console.warn(`\u8B66\u544A [${warning.code}] ${warning.path ? `${warning.path}\uFF1A` : ""}${warning.message}`);
    }
    return;
  }
  if (value.projectProfile && value.risk) {
    const risk = value.risk;
    console.log(`\u4EFB\u52A1\uFF1A${String(value.task)}`);
    console.log(`\u98CE\u9669\u7B49\u7EA7\uFF1A${riskLabels[risk.level] ?? risk.level}`);
    for (const reason of risk.reasons) console.log(`- ${reason}`);
    const memories = value.relevantMemories;
    const skills = value.relevantSkills;
    const fixes = value.recommendedFixPatterns;
    console.log(`\u76F8\u5173 Memory\uFF1A${memories.map((item) => item.id).filter(Boolean).join("\u3001") || "\u65E0"}`);
    console.log(`\u76F8\u5173 Skill\uFF1A${skills.map((item) => item.id).filter(Boolean).join("\u3001") || "\u65E0"}`);
    console.log(`\u63A8\u8350 Fix Pattern\uFF1A${fixes.map((item) => item.id).filter(Boolean).join("\u3001") || "\u65E0"}`);
    for (const warning of value.warnings) console.warn(`\u8B66\u544A\uFF1A${warning}`);
    return;
  }
  if (value.recommendedAction && value.allowedActions) {
    console.log(`\u63A8\u8350\u63D0\u4EA4\u65B9\u5F0F\uFF1A${actionLabels[String(value.recommendedAction)] ?? String(value.recommendedAction)}`);
    console.log(`\u98CE\u9669\u7B49\u7EA7\uFF1A${riskLabels[String(value.riskLevel)] ?? String(value.riskLevel)}`);
    console.log(`\u53EF\u9009\u64CD\u4F5C\uFF1A${value.allowedActions.map((action) => actionLabels[action] ?? action).join("\u3001")}`);
    for (const reason of value.reasons) console.log(`- ${reason}`);
    return;
  }
  if ("initialized" in value && value.pendingCandidates) {
    const pending = value.pendingCandidates;
    console.log(`\u521D\u59CB\u5316\u72B6\u6001\uFF1A${value.initialized ? "\u5DF2\u521D\u59CB\u5316" : "\u672A\u521D\u59CB\u5316"}`);
    console.log(`\u9879\u76EE\u6A21\u5F0F\uFF1A${modeLabels[String(value.mode)] ?? String(value.mode ?? "\u672A\u77E5")}`);
    const validateLabel = value.validate === "ok" ? "\u901A\u8FC7" : value.validate === "failed" ? "\u5931\u8D25" : String(value.validate);
    console.log(`\u914D\u7F6E\u6821\u9A8C\uFF1A${validateLabel}`);
    console.log(`\u5F85\u5BA1\u6838\u5019\u9009\uFF1Amemory ${pending.memory}\u3001skill ${pending.skill}\u3001fix pattern ${pending.fixPattern}`);
    console.log(`Git \u53D8\u66F4\u6587\u4EF6\u6570\uFF1A${String(value.gitDirtyFiles)}`);
    return;
  }
  if (typeof value.score === "number" && Array.isArray(value.good)) {
    console.log(`\u4ED3\u5E93\u6CBB\u7406\u5065\u5EB7\u5206\uFF1A${value.score}/100`);
    for (const item of value.good) console.log(`\u2713 ${item}`);
    for (const warning of value.warnings) console.warn(`\u8B66\u544A\uFF1A${warning}`);
    for (const action of value.actions) console.log(`\u5EFA\u8BAE\uFF1A${action}`);
    return;
  }
  console.log(JSON.stringify(result, null, 2));
}
function printError(error, json) {
  const payload = {
    ok: false,
    error: {
      code: error.code,
      message: error.message,
      ...error.path ? { path: error.path } : {}
    },
    warnings: []
  };
  if (json) console.log(JSON.stringify(payload));
  else console.error(`[${error.code}] ${error.message}`);
}
function candidateKind(command) {
  if (command === "memory") return "memory";
  if (command === "skill") return "skill";
  return "fix_pattern";
}
async function candidateCommand(root, parsed) {
  const [command, action] = parsed.positionals;
  const kind = candidateKind(command);
  if (action === "list-candidates") return { kind, candidates: await listCandidates(root, kind) };
  if (action === "list" && kind !== "memory") return { kind, artifacts: await listApproved(root, kind) };
  if (["approve", "reject", "archive", "merge"].includes(action ?? "")) {
    const id = optionString(parsed, "id") ?? parsed.positionals[2];
    if (!id) {
      throw new CliError(
        "E_INVALID_CANDIDATE",
        `${action} \u64CD\u4F5C\u9700\u8981\u5019\u9009 ID\u3002`
      );
    }
    return reviewCandidate({
      root,
      kind,
      id,
      action,
      mergedInto: optionString(parsed, "merged-into"),
      reviewer: optionString(parsed, "reviewer"),
      dryRun: parsed.options["dry-run"] === true
    });
  }
  if (action !== "propose") {
    throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u7684 ${command} \u64CD\u4F5C\uFF1A${action ?? ""}`);
  }
  const valueName = kind === "memory" ? "content" : kind === "skill" ? "description" : "pattern";
  const visibility = optionString(parsed, "visibility") ?? "private";
  if (visibility !== "private" && visibility !== "team") {
    throw new CliError(
      "E_INVALID_CANDIDATE",
      "--visibility \u53EA\u80FD\u662F private \u6216 team\u3002"
    );
  }
  return proposeCandidate({
    root,
    kind,
    id: requiredOption(parsed, "id"),
    value: requiredOption(parsed, valueName),
    task: optionString(parsed, "task"),
    scope: commaList(optionString(parsed, "scope")),
    dryRun: parsed.options["dry-run"] === true,
    visibility
  });
}
async function confirmUpgrade(plan) {
  printHuman(plan);
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new CliError(
      "E_UPGRADE_CONFIRMATION_REQUIRED",
      "\u975E\u4EA4\u4E92\u73AF\u5883\u5FC5\u987B\u4F7F\u7528 --yes \u6216 --dry-run\u3002"
    );
  }
  const prompt = createInterface2({ input: stdin, output: stdout });
  try {
    const answer = await prompt.question("\u786E\u8BA4\u6267\u884C\u4E0A\u8FF0\u5B89\u5168\u589E\u91CF\u5347\u7EA7\uFF1F\u8F93\u5165 yes \u7EE7\u7EED\uFF1A");
    return answer.trim().toLowerCase() === "yes";
  } finally {
    prompt.close();
  }
}
async function dispatch(root, parsed) {
  const [command, subcommand, ...rest] = parsed.positionals;
  switch (command) {
    case "init": {
      const rawMode = optionString(parsed, "mode") ?? "team";
      if (rawMode !== "team" && rawMode !== "personal") {
        throw new CliError("E_UNKNOWN_COMMAND", "--mode \u53EA\u80FD\u662F `team` \u6216 `personal`\u3002");
      }
      const tool2 = optionString(parsed, "tool") ?? "all";
      if (!toolSelections.includes(tool2)) {
        throw new CliError("E_UNKNOWN_COMMAND", `\u4E0D\u652F\u6301\u7684\u5DE5\u5177\uFF1A${tool2}`);
      }
      const entry = optionString(parsed, "entry") ?? "auto";
      if (!["auto", "hook", "plugin", "mcp-only", "none"].includes(entry)) {
        throw new CliError("E_UNSUPPORTED_ENTRY", `\u4E0D\u652F\u6301\u7684 entry\uFF1A${entry}`);
      }
      return initializeProject({
        root,
        mode: rawMode,
        dryRun: parsed.options["dry-run"] === true,
        tool: tool2,
        entry
      });
    }
    case "doctor":
      return doctor(root);
    case "update": {
      const tool2 = optionString(parsed, "tool") ?? "auto";
      if (!toolSelections.includes(tool2)) {
        throw new CliError("E_UNKNOWN_COMMAND", `\u4E0D\u652F\u6301\u7684\u5DE5\u5177\uFF1A${tool2}`);
      }
      const entry = optionString(parsed, "entry") ?? "auto";
      if (!["auto", "hook", "plugin", "mcp-only", "none"].includes(entry)) {
        throw new CliError("E_UNSUPPORTED_ENTRY", `\u4E0D\u652F\u6301\u7684 entry\uFF1A${entry}`);
      }
      const rollback = parsed.options.rollback === true || typeof parsed.options.rollback === "string";
      const rollbackRunId = typeof parsed.options.rollback === "string" ? parsed.options.rollback : rest[0];
      const dryRun = parsed.options["dry-run"] === true;
      const source = optionString(parsed, "source");
      let confirmed = parsed.options.yes === true;
      if (!rollback && !dryRun && !confirmed && source) {
        const prepared = await createUpgradePlan(root, source, "plan");
        if (prepared.plan.upgradeAvailable) {
          if (parsed.options.json === true || !stdin.isTTY || !stdout.isTTY) {
            throw new CliError(
              "E_UPGRADE_CONFIRMATION_REQUIRED",
              "\u975E\u4EA4\u4E92\u73AF\u5883\u5FC5\u987B\u4F7F\u7528 --yes \u6216 --dry-run\u3002"
            );
          }
          confirmed = await confirmUpgrade(prepared.plan);
          if (!confirmed) {
            return {
              ...prepared.plan,
              command: "update",
              action: "migrate"
            };
          }
        }
      }
      return runUpdate({
        root,
        source,
        tool: tool2,
        entry,
        dryRun,
        confirmed,
        rollback,
        rollbackRunId
      });
    }
    case "validate":
      return validateProject(root, parsed.options.strict === true);
    case "context": {
      const task = optionString(parsed, "task") ?? [subcommand, ...rest].filter(Boolean).join(" ");
      if (!task) throw new CliError("E_UNKNOWN_COMMAND", "context \u547D\u4EE4\u9700\u8981\u63D0\u4F9B\u4EFB\u52A1\u63CF\u8FF0\u3002");
      return buildContextPack(root, task);
    }
    case "commit-options": {
      const sessionId = optionString(parsed, "session-id");
      const explicitTask = optionString(parsed, "task");
      let task = explicitTask;
      if (!task && sessionId) {
        const latest = await readLatestPreflight(root, sessionId);
        task = latest?.task;
      }
      const result = await getCommitOptions(root, {
        task,
        paths: commaList(optionString(parsed, "paths"))
      });
      if (sessionId) {
        await recordRuntimeActivity(root, sessionId, "get_commit_options");
      }
      return result;
    }
    case "record-trace": {
      const sessionId = optionString(parsed, "session-id");
      let task = optionString(parsed, "task");
      let latest = null;
      if (!task && sessionId) {
        latest = await readLatestPreflight(root, sessionId);
        task = latest?.task;
      } else if (sessionId) {
        latest = await readLatestPreflight(root, sessionId);
      }
      if (!task) {
        throw new CliError("E_INVALID_CANDIDATE", "\u7F3A\u5C11\u5FC5\u586B\u9009\u9879 --task\u3002");
      }
      const outcomeStatus = optionString(parsed, "outcome-status") ?? "partial";
      if (!["success", "failure", "partial"].includes(outcomeStatus)) {
        throw new CliError(
          "E_INVALID_CANDIDATE",
          "--outcome-status \u53EA\u80FD\u662F success\u3001failure \u6216 partial\u3002"
        );
      }
      const result = await recordTrace(root, {
        task,
        outcome: optionString(parsed, "outcome") ?? null,
        outcomeStatus,
        usedMemories: latest?.contextPack.relevantMemories.filter((item) => (item.relevanceScore ?? 0) > 0).map((item) => item.id).filter(Boolean),
        usedSkills: latest?.contextPack.relevantSkills.filter((item) => (item.relevanceScore ?? 0) > 0).map((item) => item.id).filter(Boolean),
        usedFixPatterns: latest?.contextPack.recommendedFixPatterns.filter((item) => (item.relevanceScore ?? 0) > 0).map((item) => item.id).filter(Boolean),
        dryRun: parsed.options["dry-run"] === true,
        sessionId,
        preflightId: latest?.id
      });
      if (sessionId && parsed.options["dry-run"] !== true) {
        await recordRuntimeActivity(root, sessionId, "record_trace");
      }
      return result;
    }
    case "status":
      return getStatus(root, parsed.options["dry-run"] === true);
    case "handshake": {
      const tool2 = optionString(parsed, "tool") ?? "auto";
      if (!toolSelections.includes(tool2)) {
        throw new CliError("E_UNKNOWN_COMMAND", `\u4E0D\u652F\u6301\u7684\u5DE5\u5177\uFF1A${tool2}`);
      }
      return handshake({ root, tool: tool2 });
    }
    case "activate": {
      const tool2 = optionString(parsed, "tool") ?? "auto";
      if (!toolSelections.includes(tool2)) {
        throw new CliError("E_UNKNOWN_COMMAND", `\u4E0D\u652F\u6301\u7684\u5DE5\u5177\uFF1A${tool2}`);
      }
      const entry = optionString(parsed, "entry") ?? "auto";
      if (!["auto", "hook", "plugin", "mcp-only", "none"].includes(entry)) {
        throw new CliError("E_UNSUPPORTED_ENTRY", `\u4E0D\u652F\u6301\u7684 entry\uFF1A${entry}`);
      }
      return activateIntegrations(root, tool2, parsed.options["dry-run"] === true, entry);
    }
    case "deactivate": {
      const tool2 = optionString(parsed, "tool") ?? "auto";
      if (!toolSelections.includes(tool2)) {
        throw new CliError("E_UNKNOWN_COMMAND", `\u4E0D\u652F\u6301\u7684\u5DE5\u5177\uFF1A${tool2}`);
      }
      return deactivateIntegrations(root, tool2, parsed.options["dry-run"] === true);
    }
    case "hook": {
      if (!["session-start", "user-prompt-submit", "pre-tool-use", "stop"].includes(subcommand ?? "")) {
        throw new CliError("E_UNKNOWN_COMMAND", `\u4E0D\u652F\u6301\u7684 hook event\uFF1A${subcommand ?? ""}`);
      }
      const tool2 = optionString(parsed, "tool");
      if (!tool2 || !["codex", "claude-code", "opencode"].includes(tool2)) {
        throw new CliError("E_UNKNOWN_COMMAND", "hook --tool \u4EC5\u652F\u6301 codex\u3001claude-code \u6216 opencode\u3002");
      }
      let input = {};
      if (!optionString(parsed, "task") && !stdin.isTTY) {
        let rawInput = "";
        for await (const chunk of stdin) rawInput += String(chunk);
        if (rawInput.trim()) {
          try {
            input = JSON.parse(rawInput);
          } catch {
            throw new CliError("E_HOOK_INPUT", "Hook stdin \u4E0D\u662F\u6709\u6548 JSON\u3002");
          }
        }
      }
      return runHook({
        root,
        tool: tool2,
        event: subcommand,
        input,
        task: optionString(parsed, "task")
      });
    }
    case "memory":
    case "skill":
    case "fix-pattern":
      return candidateCommand(root, parsed);
    case "learning":
      if (subcommand === "classify") {
        return classifyLearning(requiredOption(parsed, "task"), requiredOption(parsed, "observation"));
      }
      if (subcommand === "inbox") {
        const task = optionString(parsed, "task");
        const observation = optionString(parsed, "observation");
        return task && observation ? createInbox(root, task, observation, parsed.options["dry-run"] === true) : { items: await listInbox(root) };
      }
      if (subcommand === "triage") {
        const id = optionString(parsed, "id") ?? rest[0];
        if (!id) throw new CliError("E_INVALID_CANDIDATE", "learning triage \u9700\u8981\u63D0\u4F9B inbox ID\u3002");
        return triageInbox(root, id, parsed.options["dry-run"] === true);
      }
      if (subcommand === "analyze") {
        return runBackgroundLearningIfDue(
          root,
          true,
          parsed.options["dry-run"] === true
        );
      }
      throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u7684 learning \u64CD\u4F5C\uFF1A${subcommand ?? ""}`);
    case "candidate":
      if (subcommand !== "promote") {
        throw new CliError("E_UNKNOWN_COMMAND", "\u8BF7\u4F7F\u7528 candidate promote\u3002");
      }
      return promoteCandidate({
        root,
        id: rest[0] ?? requiredOption(parsed, "id"),
        reviewer: optionString(parsed, "reviewer"),
        dryRun: parsed.options["dry-run"] === true
      });
    case "closure":
      if (subcommand === "status") return closureDiagnostics(root);
      if (subcommand === "recover") {
        return recoverLatestClosure(
          root,
          optionString(parsed, "session-id"),
          parsed.options["dry-run"] === true
        );
      }
      throw new CliError("E_UNKNOWN_COMMAND", "\u8BF7\u4F7F\u7528 closure status \u6216 closure recover\u3002");
    case "evidence":
      if (subcommand !== "explain") {
        throw new CliError("E_UNKNOWN_COMMAND", "\u8BF7\u4F7F\u7528 evidence explain <asset-id>\u3002");
      }
      if (!rest[0]) throw new CliError("E_INVALID_CANDIDATE", "\u7F3A\u5C11\u8D44\u4EA7 ID\u3002");
      return explainEvidence(root, rest[0]);
    case "lifecycle":
      if (subcommand === "propose") {
        return maintainAssets(root, parsed.options["dry-run"] === true);
      }
      if (subcommand === "apply") {
        if (!rest[0]) throw new CliError("E_INVALID_CANDIDATE", "\u7F3A\u5C11\u63D0\u6848 ID\u3002");
        return applyLifecycleProposal(
          root,
          rest[0],
          optionString(parsed, "reviewer"),
          parsed.options["dry-run"] === true
        );
      }
      if (subcommand === "list") return { proposals: await listLifecycleProposals(root) };
      if (subcommand === "restore") {
        if (!rest[0]) throw new CliError("E_INVALID_CANDIDATE", "\u7F3A\u5C11\u8D44\u4EA7 ID\u3002");
        return proposeLifecycleRestore(
          root,
          rest[0],
          parsed.options["dry-run"] === true
        );
      }
      throw new CliError("E_UNKNOWN_COMMAND", "\u8BF7\u4F7F\u7528 lifecycle propose|list|apply|restore\u3002");
    case "explain": {
      if (!subcommand) throw new CliError("E_UNKNOWN_COMMAND", "explain \u547D\u4EE4\u9700\u8981\u63D0\u4F9B\u89E3\u91CA\u76EE\u6807\u3002");
      const task = optionString(parsed, "task") ?? rest.join(" ");
      return explain(root, subcommand, task);
    }
    case "health":
      if (subcommand !== "check") throw new CliError("E_UNKNOWN_COMMAND", "\u8BF7\u4F7F\u7528 health check\u3002");
      return healthCheck(
        root,
        await listRecurringErrors(root),
        parsed.options.deep === true
      );
    case "maintain": {
      const dryRun = parsed.options["dry-run"] === true;
      const learning = await runBackgroundLearningIfDue(root, true, dryRun);
      const lifecycle = await maintainAssets(root, dryRun);
      return { ...lifecycle, learning };
    }
    case "import":
      if (subcommand === "scan") return { sources: await scanImportSources(root) };
      if (subcommand === "plan") return { importPlan: await buildImportPlan(root), withoutSecrets: true };
      throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u7684 import \u64CD\u4F5C\uFF1A${subcommand ?? ""}`);
    case "recurring-errors":
      if (subcommand === "list") return { signals: await listRecurringErrors(root) };
      if (subcommand === "analyze") return analyzeRecurringErrors(root, parsed.options["dry-run"] === true);
      if (subcommand === "recommend") return {
        recommendations: await recommendRecurringErrors(root, requiredOption(parsed, "task"))
      };
      if (subcommand === "propose-fix-pattern") {
        const id = rest[0] ?? optionString(parsed, "id");
        if (!id) throw new CliError("E_INVALID_CANDIDATE", "\u9700\u8981\u63D0\u4F9B\u91CD\u590D\u9519\u8BEF ID\u3002");
        return proposeFromRecurring(root, id, parsed.options["dry-run"] === true);
      }
      throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u7684 recurring-errors \u64CD\u4F5C\uFF1A${subcommand ?? ""}`);
    case "patch":
      if (subcommand !== "create") throw new CliError("E_UNKNOWN_COMMAND", "\u8BF7\u4F7F\u7528 patch create\u3002");
      return createPatch(root, parsed.options["dry-run"] === true);
    default:
      throw new CliError("E_UNKNOWN_COMMAND", `\u672A\u77E5\u547D\u4EE4\uFF1A${command ?? ""}`);
  }
}
async function main() {
  const raw = process.argv.slice(2);
  let parsed;
  try {
    parsed = parseArguments(raw);
  } catch (error) {
    printError(error, raw.includes("--json"));
    process.exitCode = 1;
    return;
  }
  if (parsed.options.version) {
    console.log(VERSION);
    return;
  }
  if (parsed.options.help || !parsed.positionals.length) {
    console.log(helpText());
    return;
  }
  const json = parsed.options.json === true;
  try {
    const root = await findProjectRoot(process.cwd());
    if (parsed.positionals[0] === "mcp" && parsed.positionals[1] === "stdio") {
      await runMcpServer(root);
      return;
    }
    const result = await dispatch(root, parsed);
    const isHookInvocation = parsed.positionals[0] === "hook";
    if (isHookInvocation) console.log(JSON.stringify(result));
    else if (json) console.log(JSON.stringify(successPayload(result)));
    else printHuman(result);
    if (!isHookInvocation && result.ok === false) {
      process.exitCode = 1;
    }
  } catch (error) {
    const cliError = error instanceof CliError ? error : new CliError("E_WRITE_FAILED", error.message);
    if (parsed.positionals[0] === "hook") {
      console.log(JSON.stringify({
        systemMessage: `repo-agent\uFF1AHook \u5185\u90E8\u9519\u8BEF\uFF08${cliError.code}\uFF09\uFF1A${cliError.message}`
      }));
      return;
    }
    printError(cliError, json);
    process.exitCode = 1;
  }
}
await main();
