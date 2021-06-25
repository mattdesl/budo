// querystring is included in native-url anyway
var qs = require("querystring");
var URL = require("native-url");

module.exports = reloadCSS;

var URLEXT = {
  parse(url) {
    // Handle protocol-relative URLs, a browser feature
    if (url.indexOf("//") === 0) {
      url = document.location.protocol + url;
    }
    return URL.parse(url);
  },

  key(url, baseUrl) {
    // Strip hash/query and get a resolved URL pathname
    var parsed = URL.parse(url);
    url = URL.format({
      pathname: (parsed.pathname || "").replace(/\/+$/, "/"),
    });
    return URL.resolve(baseUrl || document.location.pathname, url);
  },
};

var baseHosts = getBaseHosts();

function reloadCSS(url, opt) {
  // by default, only reloads local style sheets
  var localOnly = true;
  if (opt && opt.local === false) {
    localOnly = false;
  }

  // determine base URL
  var baseUrl = document.location.pathname;
  var baseTag = document.querySelector("base");
  if (baseTag) {
    baseUrl = baseTag.getAttribute("href");
    var parsedBase = URLEXT.parse(baseUrl);
    parsedBase.pathname = "/";
    parsedBase.hash = null;
    parsedBase.query = null;
    parsedBase.search = null;
    baseUrl = URL.format(parsedBase);
  }

  // Find all <link> and <style> tags
  var nodes = ["link", "style"]
    .map(elements)
    .reduce(function (a, b) {
      return a.concat(b);
    }, [])
    .filter(function (el) {
      return filterStyleSheet(el, localOnly);
    })
    .map(function (el) {
      var data = {
        element: el,
      };
      var href = el.getAttribute("href");
      if (el.tagName === "LINK" && href) {
        data.key = URLEXT.key(href, baseUrl);
      }
      return data;
    });

  // Now gather all imports in those tags
  var imports = [];
  nodes.forEach(function (node) {
    recursiveFindImports(node, node.element.sheet, imports, baseUrl);
  });

  // Now try to update the matched URLs
  var keyToMatch = url ? URLEXT.key(url, baseUrl) : null;
  var matchImports = imports;
  if (keyToMatch) {
    // only match target imports
    matchImports = matchImports.filter(function (imported) {
      return imported.key === keyToMatch;
    });
  }

  // Map them to the "top most" import that needs update
  // This isn't actually the root, just the most shallow
  // style sheet we need to update for it to work in Chrome/FF/Safari
  // (Chrome has an issue where updating a deep import will break)
  matchImports = matchImports.map(getTopmostImport);

  // Filter out any potential duplicate top most imports
  // And reverse so we update deep to shallow
  matchImports = uniq(matchImports).reverse();

  // Now cache bust each import
  matchImports.forEach(bust);

  // Now find any URLs referenced by a <link> tag
  var matchLinks = nodes.filter(function (node) {
    // no keyToMatch just means bust all link tags
    var isMatch = keyToMatch ? node.key === keyToMatch : true;
    return node.element.tagName === "LINK" && isMatch;
  });

  // And re-attach each link tag
  matchLinks.forEach(function (node) {
    node.element = reattachLink(node.element);
  });
};

function bust(imported) {
  if (!imported.busted) {
    imported.rule = cacheBustImportRule(imported.rule, imported.index);
  }
  imported.busted = true;
  return imported;
}

function reattachLink(link, cb) {
  var href = link.getAttribute("href");

  var cloned = link.cloneNode(false);
  cloned.href = getCacheBustUrl(href);

  var parent = link.parentNode;
  if (parent.lastChild === link) {
    parent.appendChild(cloned);
  } else {
    parent.insertBefore(cloned, link.nextSibling);
  }

  cloned.onload = function () {
    if (link.parentNode) link.parentNode.removeChild(link);
    if (cb) cb();
  };
  return cloned;
}

function filterStyleSheet(element, localOnly) {
  if (isPrintMedia(element)) return false;
  if (element.tagName === "LINK") {
    if (!element.getAttribute("href")) return false;
    if (localOnly && !isLocalStylesheet(element)) return false;
  }
  return true;
}

function isLocalStylesheet(link) {
  var href = link.getAttribute("href");
  if (!href || link.getAttribute("rel") !== "stylesheet") return false;
  var parsed = URLEXT.parse(href);
  if (
    parsed.protocol &&
    parsed.protocol !== window.document.location.protocol
  ) {
    // different protocol, let's assume not local
    return false;
  }
  if (parsed.host) {
    // see if domain matches
    return baseHosts.indexOf(parsed.host.toLowerCase()) >= 0;
  }
  // no host / protocol... assume relative and thus local
  return true;
}

function uniq(list) {
  var result = [];
  list.forEach(function (item) {
    if (result.indexOf(item) === -1) {
      result.push(item);
    }
  });
  return result;
}

function isPrintMedia(link) {
  return link.getAttribute("media") === "print";
}

function elements(tag) {
  return Array.prototype.slice.call(document.getElementsByTagName(tag));
}

function getBaseHosts() {
  var baseHosts = ["localhost", "127.0.0.1"].map(function (h) {
    return h + ":" + window.document.location.port;
  });

  // handle current
  if (window.document.location.hostname !== "localhost") {
    baseHosts = baseHosts.concat([window.document.location.host]);
  }

  // normalize case
  return baseHosts.map(function (h) {
    return h.toLowerCase();
  });
}

function cacheBustImportRule(rule, index) {
  var parent = rule.parentStyleSheet;
  var newHref = getCacheBustUrl(rule.href);

  var media = "";
  try {
    media = rule.media.length
      ? Array.prototype.join.call(rule.media, ", ")
      : "";
  } catch (err) {
    // might get here if permission is denied for some reason
  }

  var newRule = '@import url("' + newHref + '") ' + media + ";";
  parent.insertRule(newRule, index);
  parent.deleteRule(index + 1);
  return parent.cssRules[index];
}

function getTopmostImport(imported) {
  var topmost = imported;
  while (topmost.parentImport) {
    topmost = topmost.parentImport;
  }
  return topmost;
}

function recursiveFindImports(node, styleSheet, result, baseUrl, lastImport) {
  if (!styleSheet) return;
  var rules;
  try {
    rules = styleSheet.cssRules;
  } catch (err) {
    // some sort of security error
  }
  if (!rules || rules.length === 0) {
    return;
  }

  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (rule.type === window.CSSRule.IMPORT_RULE) {
      var parentHref = rule.parentStyleSheet.href || document.location.href;
      var absoluteHref = URL.resolve(parentHref, rule.href);
      var key = URLEXT.key(absoluteHref, baseUrl);

      var newImport = {
        index: i,
        rule: rule,
        parentImport: lastImport,
        key: key,
        href: rule.href,
      };
      result.push(newImport);
      recursiveFindImports(node, rule.styleSheet, result, baseUrl, newImport);
    }
  }
}

function getCacheBustUrl(href) {
  var parsed = URL.parse(href);
  var qsObj = qs.parse(parsed.search);
  qsObj._livereload = String(Date.now());
  parsed.query = undefined;
  parsed.search = qs.stringify(qsObj);
  return URL.format(parsed);
}
