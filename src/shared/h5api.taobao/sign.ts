export class h5Encryption {
    token: any;
    time: Date
    data: UrlParamData
    appKey: string

    constructor(token, time, data) {
        this.token = token;
        this.time = time
        this.data = data
        this.appKey = "12574478"
    }

    signH5ItemPageReq() {
        console.log(this.token, this.time, this.data, this.appKey)
        return this.h5ItemPage(this.token + "&" + this.time + "&" + this.appKey + "&" + this.data)
    }

    signH5ReviewReq() {
        return this.h5ReviewPage(this.token + "&" + this.time + "&" + this.appKey + "&" + this.data)
    }

    h5ItemPage(a) {
        function b(a, b) {
            return a << b | a >>> 32 - b
        }
        function c(a, b) {
            var c, d, e, f, g;
            return e = 2147483648 & a,
                f = 2147483648 & b,
                c = 1073741824 & a,
                d = 1073741824 & b,
                g = (1073741823 & a) + (1073741823 & b),
                c & d ? 2147483648 ^ g ^ e ^ f : c | d ? 1073741824 & g ? 3221225472 ^ g ^ e ^ f : 1073741824 ^ g ^ e ^ f : g ^ e ^ f
        }
        function d(a, b, c) {
            return a & b | ~a & c
        }
        function e(a, b, c) {
            return a & c | b & ~c
        }
        function f(a, b, c) {
            return a ^ b ^ c
        }
        function g(a, b, c) {
            return b ^ (a | ~c)
        }
        function h(a, e, f, g, h, i, j) {
            return a = c(a, c(c(d(e, f, g), h), j)),
                c(b(a, i), e)
        }
        function i(a, d, f, g, h, i, j) {
            return a = c(a, c(c(e(d, f, g), h), j)),
                c(b(a, i), d)
        }
        function j(a, d, e, g, h, i, j) {
            return a = c(a, c(c(f(d, e, g), h), j)),
                c(b(a, i), d)
        }
        function k(a, d, e, f, h, i, j) {
            return a = c(a, c(c(g(d, e, f), h), j)),
                c(b(a, i), d)
        }
        function l(a) {
            for (var b, c = a.length, d = c + 8, e = (d - d % 64) / 64, f = 16 * (e + 1), g = new Array(f - 1), h = 0, i = 0; c > i;)
                b = (i - i % 4) / 4,
                    h = i % 4 * 8,
                    g[b] = g[b] | a.charCodeAt(i) << h,
                    i++;
            return b = (i - i % 4) / 4,
                h = i % 4 * 8,
                g[b] = g[b] | 128 << h,
                g[f - 2] = c << 3,
                g[f - 1] = c >>> 29,
                g
        }
        function m(a) {
            var b, c, d = "", e = "";
            for (c = 0; 3 >= c; c++)
                b = a >>> 8 * c & 255,
                    e = "0" + b.toString(16),
                    d += e.substr(e.length - 2, 2);
            return d
        }
        function n(a) {
            a = a.replace(/\r\n/g, "\n");
            for (var b = "", c = 0; c < a.length; c++) {
                var d = a.charCodeAt(c);
                128 > d ? b += String.fromCharCode(d) : d > 127 && 2048 > d ? (b += String.fromCharCode(d >> 6 | 192),
                    b += String.fromCharCode(63 & d | 128)) : (b += String.fromCharCode(d >> 12 | 224),
                        b += String.fromCharCode(d >> 6 & 63 | 128),
                        b += String.fromCharCode(63 & d | 128))
            }
            return b
        }
        var o, p, q, r, s, t, u, v, w, x = [], y = 7, z = 12, A = 17, B = 22, C = 5, D = 9, E = 14, F = 20, G = 4, H = 11, I = 16, J = 23, K = 6, L = 10, M = 15, N = 21;
        for (a = n(a),
            x = l(a),
            t = 1732584193,
            u = 4023233417,
            v = 2562383102,
            w = 271733878,
            o = 0; o < x.length; o += 16)
            p = t,
                q = u,
                r = v,
                s = w,
                t = h(t, u, v, w, x[o + 0], y, 3614090360),
                w = h(w, t, u, v, x[o + 1], z, 3905402710),
                v = h(v, w, t, u, x[o + 2], A, 606105819),
                u = h(u, v, w, t, x[o + 3], B, 3250441966),
                t = h(t, u, v, w, x[o + 4], y, 4118548399),
                w = h(w, t, u, v, x[o + 5], z, 1200080426),
                v = h(v, w, t, u, x[o + 6], A, 2821735955),
                u = h(u, v, w, t, x[o + 7], B, 4249261313),
                t = h(t, u, v, w, x[o + 8], y, 1770035416),
                w = h(w, t, u, v, x[o + 9], z, 2336552879),
                v = h(v, w, t, u, x[o + 10], A, 4294925233),
                u = h(u, v, w, t, x[o + 11], B, 2304563134),
                t = h(t, u, v, w, x[o + 12], y, 1804603682),
                w = h(w, t, u, v, x[o + 13], z, 4254626195),
                v = h(v, w, t, u, x[o + 14], A, 2792965006),
                u = h(u, v, w, t, x[o + 15], B, 1236535329),
                t = i(t, u, v, w, x[o + 1], C, 4129170786),
                w = i(w, t, u, v, x[o + 6], D, 3225465664),
                v = i(v, w, t, u, x[o + 11], E, 643717713),
                u = i(u, v, w, t, x[o + 0], F, 3921069994),
                t = i(t, u, v, w, x[o + 5], C, 3593408605),
                w = i(w, t, u, v, x[o + 10], D, 38016083),
                v = i(v, w, t, u, x[o + 15], E, 3634488961),
                u = i(u, v, w, t, x[o + 4], F, 3889429448),
                t = i(t, u, v, w, x[o + 9], C, 568446438),
                w = i(w, t, u, v, x[o + 14], D, 3275163606),
                v = i(v, w, t, u, x[o + 3], E, 4107603335),
                u = i(u, v, w, t, x[o + 8], F, 1163531501),
                t = i(t, u, v, w, x[o + 13], C, 2850285829),
                w = i(w, t, u, v, x[o + 2], D, 4243563512),
                v = i(v, w, t, u, x[o + 7], E, 1735328473),
                u = i(u, v, w, t, x[o + 12], F, 2368359562),
                t = j(t, u, v, w, x[o + 5], G, 4294588738),
                w = j(w, t, u, v, x[o + 8], H, 2272392833),
                v = j(v, w, t, u, x[o + 11], I, 1839030562),
                u = j(u, v, w, t, x[o + 14], J, 4259657740),
                t = j(t, u, v, w, x[o + 1], G, 2763975236),
                w = j(w, t, u, v, x[o + 4], H, 1272893353),
                v = j(v, w, t, u, x[o + 7], I, 4139469664),
                u = j(u, v, w, t, x[o + 10], J, 3200236656),
                t = j(t, u, v, w, x[o + 13], G, 681279174),
                w = j(w, t, u, v, x[o + 0], H, 3936430074),
                v = j(v, w, t, u, x[o + 3], I, 3572445317),
                u = j(u, v, w, t, x[o + 6], J, 76029189),
                t = j(t, u, v, w, x[o + 9], G, 3654602809),
                w = j(w, t, u, v, x[o + 12], H, 3873151461),
                v = j(v, w, t, u, x[o + 15], I, 530742520),
                u = j(u, v, w, t, x[o + 2], J, 3299628645),
                t = k(t, u, v, w, x[o + 0], K, 4096336452),
                w = k(w, t, u, v, x[o + 7], L, 1126891415),
                v = k(v, w, t, u, x[o + 14], M, 2878612391),
                u = k(u, v, w, t, x[o + 5], N, 4237533241),
                t = k(t, u, v, w, x[o + 12], K, 1700485571),
                w = k(w, t, u, v, x[o + 3], L, 2399980690),
                v = k(v, w, t, u, x[o + 10], M, 4293915773),
                u = k(u, v, w, t, x[o + 1], N, 2240044497),
                t = k(t, u, v, w, x[o + 8], K, 1873313359),
                w = k(w, t, u, v, x[o + 15], L, 4264355552),
                v = k(v, w, t, u, x[o + 6], M, 2734768916),
                u = k(u, v, w, t, x[o + 13], N, 1309151649),
                t = k(t, u, v, w, x[o + 4], K, 4149444226),
                w = k(w, t, u, v, x[o + 11], L, 3174756917),
                v = k(v, w, t, u, x[o + 2], M, 718787259),
                u = k(u, v, w, t, x[o + 9], N, 3951481745),
                t = c(t, p),
                u = c(u, q),
                v = c(v, r),
                w = c(w, s);
        var O = m(t) + m(u) + m(v) + m(w);
        return O.toLowerCase()
    }

    h5ReviewPage(e) {
        function t(e, t) {
            return e << t | e >>> 32 - t
        }
        function n(e, t) {
            var n, r, i, a, o;
            return i = 2147483648 & e,
                a = 2147483648 & t,
                o = (1073741823 & e) + (1073741823 & t),
                (n = 1073741824 & e) & (r = 1073741824 & t) ? 2147483648 ^ o ^ i ^ a : n | r ? 1073741824 & o ? 3221225472 ^ o ^ i ^ a : 1073741824 ^ o ^ i ^ a : o ^ i ^ a
        }
        function r(e, r, i, a, o, s, l) {
            return e = n(e, n(n(function (e, t, n) {
                return e & t | ~e & n
            }(r, i, a), o), l)),
                n(t(e, s), r)
        }
        function i(e, r, i, a, o, s, l) {
            return e = n(e, n(n(function (e, t, n) {
                return e & n | t & ~n
            }(r, i, a), o), l)),
                n(t(e, s), r)
        }
        function a(e, r, i, a, o, s, l) {
            return e = n(e, n(n(function (e, t, n) {
                return e ^ t ^ n
            }(r, i, a), o), l)),
                n(t(e, s), r)
        }
        function o(e, r, i, a, o, s, l) {
            return e = n(e, n(n(function (e, t, n) {
                return t ^ (e | ~n)
            }(r, i, a), o), l)),
                n(t(e, s), r)
        }
        function s(e) {
            var t, n = "", r = "";
            for (t = 0; 3 >= t; t++)
                n += (r = "0" + (e >>> 8 * t & 255).toString(16)).substr(r.length - 2, 2);
            return n
        }
        var l, c, p, u, d, f, m, g, v, h;
        for (h = function (e) {
            for (var t, n = e.length, r = n + 8, i = 16 * ((r - r % 64) / 64 + 1), a = new Array(i - 1), o = 0, s = 0; n > s;)
                o = s % 4 * 8,
                    a[t = (s - s % 4) / 4] = a[t] | e.charCodeAt(s) << o,
                    s++;
            return o = s % 4 * 8,
                a[t = (s - s % 4) / 4] = a[t] | 128 << o,
                a[i - 2] = n << 3,
                a[i - 1] = n >>> 29,
                a
        }(e = function (e) {
            e = e.replace(/\r\n/g, "\n");
            for (var t = "", n = 0; n < e.length; n++) {
                var r = e.charCodeAt(n);
                128 > r ? t += String.fromCharCode(r) : r > 127 && 2048 > r ? (t += String.fromCharCode(r >> 6 | 192),
                    t += String.fromCharCode(63 & r | 128)) : (t += String.fromCharCode(r >> 12 | 224),
                        t += String.fromCharCode(r >> 6 & 63 | 128),
                        t += String.fromCharCode(63 & r | 128))
            }
            return t
        }(e)),
            f = 1732584193,
            m = 4023233417,
            g = 2562383102,
            v = 271733878,
            l = 0; l < h.length; l += 16)
            c = f,
                p = m,
                u = g,
                d = v,
                f = r(f, m, g, v, h[l + 0], 7, 3614090360),
                v = r(v, f, m, g, h[l + 1], 12, 3905402710),
                g = r(g, v, f, m, h[l + 2], 17, 606105819),
                m = r(m, g, v, f, h[l + 3], 22, 3250441966),
                f = r(f, m, g, v, h[l + 4], 7, 4118548399),
                v = r(v, f, m, g, h[l + 5], 12, 1200080426),
                g = r(g, v, f, m, h[l + 6], 17, 2821735955),
                m = r(m, g, v, f, h[l + 7], 22, 4249261313),
                f = r(f, m, g, v, h[l + 8], 7, 1770035416),
                v = r(v, f, m, g, h[l + 9], 12, 2336552879),
                g = r(g, v, f, m, h[l + 10], 17, 4294925233),
                m = r(m, g, v, f, h[l + 11], 22, 2304563134),
                f = r(f, m, g, v, h[l + 12], 7, 1804603682),
                v = r(v, f, m, g, h[l + 13], 12, 4254626195),
                g = r(g, v, f, m, h[l + 14], 17, 2792965006),
                f = i(f, m = r(m, g, v, f, h[l + 15], 22, 1236535329), g, v, h[l + 1], 5, 4129170786),
                v = i(v, f, m, g, h[l + 6], 9, 3225465664),
                g = i(g, v, f, m, h[l + 11], 14, 643717713),
                m = i(m, g, v, f, h[l + 0], 20, 3921069994),
                f = i(f, m, g, v, h[l + 5], 5, 3593408605),
                v = i(v, f, m, g, h[l + 10], 9, 38016083),
                g = i(g, v, f, m, h[l + 15], 14, 3634488961),
                m = i(m, g, v, f, h[l + 4], 20, 3889429448),
                f = i(f, m, g, v, h[l + 9], 5, 568446438),
                v = i(v, f, m, g, h[l + 14], 9, 3275163606),
                g = i(g, v, f, m, h[l + 3], 14, 4107603335),
                m = i(m, g, v, f, h[l + 8], 20, 1163531501),
                f = i(f, m, g, v, h[l + 13], 5, 2850285829),
                v = i(v, f, m, g, h[l + 2], 9, 4243563512),
                g = i(g, v, f, m, h[l + 7], 14, 1735328473),
                f = a(f, m = i(m, g, v, f, h[l + 12], 20, 2368359562), g, v, h[l + 5], 4, 4294588738),
                v = a(v, f, m, g, h[l + 8], 11, 2272392833),
                g = a(g, v, f, m, h[l + 11], 16, 1839030562),
                m = a(m, g, v, f, h[l + 14], 23, 4259657740),
                f = a(f, m, g, v, h[l + 1], 4, 2763975236),
                v = a(v, f, m, g, h[l + 4], 11, 1272893353),
                g = a(g, v, f, m, h[l + 7], 16, 4139469664),
                m = a(m, g, v, f, h[l + 10], 23, 3200236656),
                f = a(f, m, g, v, h[l + 13], 4, 681279174),
                v = a(v, f, m, g, h[l + 0], 11, 3936430074),
                g = a(g, v, f, m, h[l + 3], 16, 3572445317),
                m = a(m, g, v, f, h[l + 6], 23, 76029189),
                f = a(f, m, g, v, h[l + 9], 4, 3654602809),
                v = a(v, f, m, g, h[l + 12], 11, 3873151461),
                g = a(g, v, f, m, h[l + 15], 16, 530742520),
                f = o(f, m = a(m, g, v, f, h[l + 2], 23, 3299628645), g, v, h[l + 0], 6, 4096336452),
                v = o(v, f, m, g, h[l + 7], 10, 1126891415),
                g = o(g, v, f, m, h[l + 14], 15, 2878612391),
                m = o(m, g, v, f, h[l + 5], 21, 4237533241),
                f = o(f, m, g, v, h[l + 12], 6, 1700485571),
                v = o(v, f, m, g, h[l + 3], 10, 2399980690),
                g = o(g, v, f, m, h[l + 10], 15, 4293915773),
                m = o(m, g, v, f, h[l + 1], 21, 2240044497),
                f = o(f, m, g, v, h[l + 8], 6, 1873313359),
                v = o(v, f, m, g, h[l + 15], 10, 4264355552),
                g = o(g, v, f, m, h[l + 6], 15, 2734768916),
                m = o(m, g, v, f, h[l + 13], 21, 1309151649),
                f = o(f, m, g, v, h[l + 4], 6, 4149444226),
                v = o(v, f, m, g, h[l + 11], 10, 3174756917),
                g = o(g, v, f, m, h[l + 2], 15, 718787259),
                m = o(m, g, v, f, h[l + 9], 21, 3951481745),
                f = n(f, c),
                m = n(m, p),
                g = n(g, u),
                v = n(v, d);
        return (s(f) + s(m) + s(g) + s(v)).toLowerCase()
    }

   

}