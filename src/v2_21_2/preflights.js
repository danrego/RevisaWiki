    async function v2212PrepareEvidence(task, options) {
        const source = task.source, sourceHash = v24SyntaxHash(source);
        const cfg = {...options, v2212OriginalDraftHash: sourceHash, v2212VerifiedFiles: []};
        delete cfg.v2212PortalAvailability;
        if (cfg.namespaceNumber !== 0 || cfg.sectionOnly || task.section !== null) return cfg;
        // Existence is global. Query the finite audited destination set so an
        // earlier field repair cannot hide a later, valid topic candidate.
        const portals = cfg.portals !== false && cfg.endMatter !== false ? v2212PortalDestinations() : [];
        cfg.v2212PortalProofRequired = true;
        cfg.v2212PortalAvailability = {sourceHash, exists: []};
        const files = v2212StructureFileRequests(source, cfg);
        const titles = [...new Set([...portals.map(name => 'Portal:' + name), ...files.map(row => 'Ficheiro:' + row.fileName)])].slice(0, 40);
        if (!titles.length) return cfg;
        const key = 'v2212-destinations:' + titles.slice().sort().join('|');
        try {
            task.guard();
            let response = endMatterReadCache.get(key);
            if (!response || Date.now() - response.time >= 120000) {
                const client = new mw.Api({ajax: {timeout: 6000}});
                const pending = client.get({action: 'query', formatversion: 2, redirects: true,
                    titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url'});
                task.preflightRequests ||= [];
                task.preflightRequests.push(pending);
                try {
                    const data = await pending;
                    task.guard();
                    response = {time: Date.now(), data};
                    if (endMatterReadCache.size >= 25) endMatterReadCache.clear();
                    endMatterReadCache.set(key, response);
                } finally {
                    task.preflightRequests = task.preflightRequests.filter(item => item !== pending);
                }
            }
            task.guard();
            const data = response.data, query = data?.query;
            if (!Array.isArray(query?.pages)) return cfg;
            const aliases = new Map();
            for (const row of [...(query.normalized || []), ...(query.redirects || [])]) {
                if (typeof row.from !== 'string' || typeof row.to !== 'string' || aliases.has(row.from)) return cfg;
                aliases.set(row.from, row.to);
            }
            function resolve(title) {
                const seen = new Set();
                while (aliases.has(title)) {
                    if (seen.has(title) || seen.size >= 8) return null;
                    seen.add(title);title = aliases.get(title);
                }
                const found = query.pages.filter(page => page.title === title);
                return found.length === 1 ? found[0] : null;
            }
            cfg.v2212PortalAvailability.exists = portals.filter(name => {
                const page = resolve('Portal:' + name);
                return page && page.ns === 100 && page.invalid !== true && page.missing !== true && Number.isSafeInteger(page.pageid) && page.pageid > 0;
            });
            if (files.length && root.crypto?.subtle && root.TextEncoder) {
                const digest = await root.crypto.subtle.digest('SHA-256', new root.TextEncoder().encode(JSON.stringify(data)));
                task.guard();
                const responseSha256 = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
                for (const request of files) {
                    const page = resolve('Ficheiro:' + request.fileName);
                    const usableImage = Array.isArray(page?.imageinfo) && page.imageinfo.some(info => {
                        if (!info || info.badfile === true || typeof info.url !== 'string' || !/^https?:\/\//.test(info.url)) return false;
                        try { const url = new URL(info.url);return !!url.hostname && !url.username && !url.password; }
                        catch (_) { return false; }
                    });
                    if (!page || page.ns !== 6 || page.invalid === true || !usableImage ||
                            !['local', 'shared'].includes(page.imagerepository)) continue;
                    cfg.v2212VerifiedFiles.push({sourceHash, target: request.target, fileName: request.fileName,
                        available: true, repository: page.imagerepository, canonicalTitle: page.title, method: 'imageinfo', responseSha256});
                }
            }
        } catch (error) {
            task.guard();
            // An unavailable lookup affects only these additions. The ordinary
            // adjustment and all integrity checks continue with the draft.
        }
        return cfg;
    }
