"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectsByCategory = exports.getFeaturedProjects = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjectByLevel = exports.getProjectById = exports.getProjects = void 0;
const Project_1 = __importDefault(require("../models/Project"));
const ragService = require('../services/ragService');
const fs = require('fs');
const path = require('path');
// Helper: normalize educationalContent to the frontend-expected shape
function mapEducationalContent(rawEC) {
    if (!rawEC || typeof rawEC !== 'object') return rawEC;
    const mapLevel = (lvl) => {
        if (!lvl || typeof lvl !== 'object') return null;
        // Support legacy keys used in the model while exposing frontend keys
        return {
            overview: lvl.overview || lvl.summary || null,
            prerequisites: lvl.prerequisites || lvl.prereqs || lvl.prerequisite || [],
            concepts: lvl.concepts || lvl.keyConcepts || [],
            resources: lvl.resources || lvl.refs || [],
            quizzes: (function() {
                const raw = lvl.quizzes || lvl.practiceQuestions || [];
                if (!Array.isArray(raw)) return [];
                return raw.map(q => {
                    if (!q || typeof q !== 'object') return null;
                    // coerce answer to number for frontend expectations
                    let ans = 0;
                    try {
                        const n = Number(q.answer);
                        ans = Number.isFinite(n) ? n : 0;
                    } catch (e) { ans = 0; }
                    return {
                        question: q.question || '',
                        options: Array.isArray(q.options) ? q.options : [],
                        answer: ans,
                        explanations: Array.isArray(q.explanations) ? q.explanations : []
                    };
                }).filter(Boolean);
            })()
        };
    };
    return {
        beginner: mapLevel(rawEC.beginner),
        intermediate: mapLevel(rawEC.intermediate),
        advanced: mapLevel(rawEC.advanced)
    };
}
// Get all projects with optional filtering
const getProjects = async (req, res) => {
    try {
        const { category, featured, search, educationalLevel, limit = '10', page = '1' } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (featured === 'true')
            query.featured = true;
        if (search) {
            query.$text = { $search: search };
        }
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const projects = await Project_1.default.find(query)
            .select('-educationalContent')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = await Project_1.default.countDocuments(query);
        res.json({
            success: true,
            data: projects,
            pagination: {
                current: pageNum,
                pages: Math.ceil(total / limitNum),
                total
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getProjects = getProjects;
// Get single project by ID with simple gating rules
const Visit = require('../models/Visit');
const User = require('../models/User');
const GoldMember = require('../models/GoldMember');

// Get single project by ID
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project_1.default.findById(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Determine requester identity from JWT token in headers
        const token = req.headers['x-auth-token'] || (req.headers.authorization && String(req.headers.authorization).split(' ')[1]);
        let user = null;
        if (token) {
            try {
                const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
                const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
                user = await User.findById(decoded.id);
            } catch (e) {
                // Invalid/expired token - treat as anonymous
                console.error('Token verification failed:', e);
            }
        }

        // If not authenticated, enforce anonymous visit limit (2 views for projects)
        if (!user) {
            const ip = req.ip || req.connection && req.connection.remoteAddress || '';
            const fingerprint = req.headers['x-fingerprint'] || null;
            const query = { ip };
            if (fingerprint) query.fingerprint = fingerprint;
            const v = await Visit.findOne(query);
            const count = v ? (v.counts.projects || 0) : 0;
            if (count >= 2) {
                return res.status(403).json({ success: false, message: 'Registration required', requireRegistration: true });
            }
            // record this visit (best-effort)
            try {
                if (v) {
                    await v.increment('projects');
                } else {
                    const nv = new Visit({ ip, fingerprint });
                    await nv.increment('projects');
                }
            } catch (e) { /* ignore visit recording errors */ }
        }

        // Normalize educationalContent shape for frontend compatibility
        const out = project.toObject ? project.toObject() : project;
        out.educationalContent = mapEducationalContent(out.educationalContent);

        // If user is present and is subscribed or is a gold member => full access
        let isGold = false;
        if (user) {
            if (user.isSubscribed) return res.json({ success: true, data: out });
            const gm = await GoldMember.findOne({ email: user.email });
            if (gm) isGold = true;
            if (isGold) return res.json({ success: true, data: out });
            // logged-in but not subscribed: restrict to first content only
            // We'll provide only the top-level fields and beginner overview as "first content"
            const limited = {
                _id: out._id,
                title: out.title,
                subtitle: out.subtitle,
                description: out.description,
                category: out.category,
                educationalContent: {
                    beginner: {
                        overview: out.educationalContent && out.educationalContent.beginner ? out.educationalContent.beginner.overview || '' : ''
                    }
                }
            };
            return res.json({ success: true, data: limited });
        }

        // Anonymous and under limit -> return full summary view (no deep technical details)
        // For unauthenticated users we already enforced the 2-visit limit; now return a limited dataset
        const anonLimited = {
            _id: out._id,
            title: out.title,
            subtitle: out.subtitle,
            description: out.description,
            category: out.category,
            // show only beginner overview for anonymous
            educationalContent: {
                beginner: {
                    overview: out.educationalContent && out.educationalContent.beginner ? out.educationalContent.beginner.overview || '' : ''
                }
            }
        };
        res.json({ success: true, data: anonLimited });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching project',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getProjectById = getProjectById;
// Get project content by educational level
const getProjectByLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const { level = 'beginner' } = req.query;
    const project = await Project_1.default.findById(id).select(`title subtitle description educationalContent.${level} technicalDetails media publications`);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        // Ensure educationalContent subobject is normalized
        const out = project.toObject ? project.toObject() : project;
        // project returned here will contain only educationalContent.<level>, map accordingly
        out.educationalContent = mapEducationalContent(out.educationalContent || { [level]: out.educationalContent });
        res.json({
            success: true,
            data: out
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching project content',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getProjectByLevel = getProjectByLevel;
// Create new project (admin only)
const createProject = async (req, res) => {
        try {
        let projectData = req.body;
        console.log('[createProject] Received request with body keys:', Object.keys(projectData || {}).join(', '));
        
        // IMMEDIATE VALIDATION: Set defaults for required fields BEFORE any processing
        if (projectData.title === undefined || projectData.title === null) projectData.title = 'Untitled Project';
        if (projectData.subtitle === undefined || projectData.subtitle === null) projectData.subtitle = 'No subtitle provided';
        if (projectData.description === undefined || projectData.description === null) projectData.description = 'No description provided';
        if (projectData.detailedDescription === undefined || projectData.detailedDescription === null) projectData.detailedDescription = projectData.description;
        if (projectData.category === undefined || projectData.category === null) projectData.category = 'ai-ml';
        
        // Trim and validate strings
        projectData.title = String(projectData.title || '').trim() || 'Untitled Project';
        projectData.subtitle = String(projectData.subtitle || '').trim() || 'No subtitle provided';
        projectData.description = String(projectData.description || '').trim() || 'No description provided';
        projectData.detailedDescription = String(projectData.detailedDescription || '').trim() || projectData.description;
        
        console.log('[createProject] After immediate validation:', { title: projectData.title, subtitle: projectData.subtitle, description: projectData.description.substring(0, 50) });
        
        // Persist the raw parsed body for debugging
        try {
            fs.writeFileSync(path.join(__dirname, 'incoming_body_debug.json'), JSON.stringify(req.body, null, 2));
        } catch (e) {
            console.error('Failed to write incoming_body_debug.json', e && e.message);
        }
        // Debug: log incoming educationalContent shape (temp)
        try { console.log('DEBUG: incoming educationalContent type:', typeof projectData.educationalContent, 'value:', projectData.educationalContent && JSON.stringify(projectData.educationalContent).slice(0,1000)); } catch (e) { console.log('DEBUG: unable to stringify incoming educationalContent'); }
    // Sanitize incoming educationalContent fields that may be stringified from frontend
        const sanitize = (raw) => {
            if (!raw || typeof raw !== 'object') return raw;
            const levels = ['beginner', 'intermediate', 'advanced'];
            const out = {};
            levels.forEach(lvl => {
                const src = raw[lvl] || {};
                const dest = {};
                // helper to try parse JSON strings
                const tryParse = (v) => {
                    if (typeof v !== 'string') return v;
                    // Try JSON.parse first
                    try {
                        return JSON.parse(v);
                    }
                    catch (e) {
                        // Attempt to repair JS-like object notation (single quotes / unquoted keys)
                        const tryRepair = (str) => {
                            try {
                                let t = String(str);
                                // Remove common JS string concatenation artifacts like: '\' +\n  '\n  '
                                t = t.replace(/'\s*\+\s*\\n\s*'/g, '');
                                t = t.replace(/"\s*\+\s*\\n\s*"/g, '');
                                // collapse newlines and trim
                                t = t.replace(/\r?\n/g, ' ').trim();
                                if (!/[\{:]/.test(t)) return null;
                                // Quote unquoted keys: foo: -> "foo":
                                t = t.replace(/([\w$-]+)\s*:/g, '"$1":');
                                // Convert single quotes to double quotes
                                t = t.replace(/'/g, '"');
                                // Remove trailing commas before } or ]
                                t = t.replace(/,\s*([\}\]])/g, '$1');
                                return JSON.parse(t);
                            }
                            catch (e2) {
                                return null;
                            }
                        };
                        const repaired = tryRepair(v);
                        if (repaired !== null) return repaired;
                        // fallback: split by newline or comma into array of strings
                        const byNewline = v.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                        if (byNewline.length > 1) return byNewline;
                        const byComma = v.split(',').map(s => s.trim()).filter(Boolean);
                        if (byComma.length > 1) return byComma;
                        return [v];
                    }
                };
                // common fields
                dest.overview = src.overview || src.summary || '';
                dest.prerequisites = Array.isArray(src.prerequisites) ? src.prerequisites : tryParse(src.prerequisites || src.prereqs || '') || [];
                // concepts may be array or JSON string
                const rawConcepts = Array.isArray(src.concepts) ? src.concepts : tryParse(src.concepts || src.keyConcepts || '') || [];
                // Preserve description field from concepts (ConceptBlock array for uploaded/rich content)
                dest.concepts = rawConcepts.map((c) => {
                    if (!c || typeof c !== 'object') return { title: c || '', description: [], images: [], videos: [], diagrams: [] };
                    return {
                        title: c.title || '',
                        description: Array.isArray(c.description) ? c.description : (c.description ? [c.description] : []),
                        images: Array.isArray(c.images) ? c.images : (c.images ? [c.images] : []),
                        videos: Array.isArray(c.videos) ? c.videos : (c.videos ? [c.videos] : []),
                        diagrams: Array.isArray(c.diagrams) ? c.diagrams : (c.diagrams ? [c.diagrams] : [])
                    };
                });
                // Normalize resources into array of { title, url, type }
                let rawResources = Array.isArray(src.resources) ? src.resources : tryParse(src.resources || src.refs || '') || [];
                const parseResourceLine = (line) => {
                    if (!line || typeof line !== 'string') return null;
                    const s = line.trim();
                    // format: title::url::type
                    if (s.includes('::')) {
                        const parts = s.split('::').map(p => p.trim());
                        if (parts.length >= 3) return { title: parts[0], url: parts[1], type: parts[2] };
                        return null;
                    }
                    // Try to repair JS-like object literal to JSON
                    try {
                        let t = s.replace(/\r?\n/g, ' ').trim();
                        t = t.replace(/([\w$-]+)\s*:/g, '"$1":');
                        t = t.replace(/'/g, '"');
                        t = t.replace(/,\s*([}\]])/g, '$1');
                        const parsed = JSON.parse(t);
                        if (parsed && typeof parsed === 'object') return parsed;
                    } catch (e) { }
                    return null;
                };
                const resourcesArr = [];
                if (Array.isArray(rawResources)) {
                    rawResources.forEach(r => {
                        if (!r && r !== 0) return;
                        if (typeof r === 'string') {
                            const parsed = parseResourceLine(r);
                            if (parsed) resourcesArr.push(parsed);
                        }
                        else if (r && typeof r === 'object') {
                            // ensure keys exist
                            resourcesArr.push({ title: r.title || '', url: r.url || '', type: r.type || '' });
                        }
                    });
                }
                dest.resources = resourcesArr;

                // Normalize quizzes into array of { question, options, answer, explanations }
                let rawQuizzes = Array.isArray(src.quizzes) ? src.quizzes : tryParse(src.quizzes || src.practiceQuestions || '') || [];
                const parseQuizLine = (line) => {
                    if (!line || typeof line !== 'string') return null;
                    const s = line.trim();
                    if (s.includes('||')) {
                        const parts = s.split('||').map(p => p.trim()).filter(Boolean);
                        if (parts.length < 4) return null;
                        const question = parts[0];
                        // Find the answer index by searching from the right for the first numeric token.
                        let answerIndex = null;
                        let answerPos = -1;
                        for (let i = parts.length - 1; i >= 1; i--) {
                            const num = parseInt(parts[i], 10);
                            if (!Number.isNaN(num)) {
                                answerIndex = num;
                                answerPos = i;
                                break;
                            }
                        }
                        if (answerIndex === null) return null;
                        const options = parts.slice(1, answerPos);
                        const explanations = parts.slice(answerPos + 1);
                        return { question, options, answer: answerIndex, explanations };
                    }
                    // Try JSON parse
                    try {
                        let t = s.replace(/\r?\n/g, ' ').trim();
                        t = t.replace(/([\w$-]+)\s*:/g, '"$1":');
                        t = t.replace(/'/g, '"');
                        t = t.replace(/,\s*([}\]])/g, '$1');
                        const parsed = JSON.parse(t);
                        if (parsed && typeof parsed === 'object') return parsed;
                    } catch (e) { }
                    return null;
                };
                const quizzesArr = [];
                if (Array.isArray(rawQuizzes)) {
                    rawQuizzes.forEach(q => {
                        if (!q && q !== 0) return;
                        if (typeof q === 'string') {
                            const parsed = parseQuizLine(q);
                            if (parsed) quizzesArr.push(parsed);
                        }
                        else if (q && typeof q === 'object') {
                            // Ensure answer is stored as a number (coerce numeric strings)
                            let ans = 0;
                            try {
                                const num = Number(q.answer);
                                ans = Number.isFinite(num) ? num : 0;
                            }
                            catch (e) { ans = 0; }
                            const opts = Array.isArray(q.options) ? q.options.map(o => String(o)) : [];
                            const exps = Array.isArray(q.explanations) ? q.explanations.map(e => String(e)) : [];
                            quizzesArr.push({ question: q.question || '', options: opts, answer: ans, explanations: exps });
                        }
                    });
                }
                dest.quizzes = quizzesArr;
                // include legacy fields if present
                dest.summary = src.summary || dest.overview;
                dest.keyConcepts = Array.isArray(src.keyConcepts) ? src.keyConcepts : dest.concepts.map((c) => (c && c.title) ? c.title : (typeof c === 'string' ? c : ''));
                dest.realWorldApplications = Array.isArray(src.realWorldApplications) ? src.realWorldApplications : dest.prerequisites;
                // other legacy fields
                dest.methodology = src.methodology || dest.overview;
                dest.technicalApproach = src.technicalApproach || dest.keyConcepts.join('; ');
                dest.implementation = src.implementation || dest.overview;
                dest.performanceMetrics = Array.isArray(src.performanceMetrics) ? src.performanceMetrics : [];
                dest.researchContributions = Array.isArray(src.researchContributions) ? src.researchContributions : dest.keyConcepts;
                dest.futureWork = Array.isArray(src.futureWork) ? src.futureWork : [];
                out[lvl] = dest;
            });
            return out;
        };
        if (projectData && projectData.educationalContent) {
            // If educationalContent arrived as a string (stringified or JS-like), try to repair/parse it first
            if (typeof projectData.educationalContent === 'string') {
                const rawECStr = projectData.educationalContent;
                let repaired = rawECStr;
                try {
                    // Remove common concatenation artifacts: ' +\n  ' and " +\n  "
                    repaired = repaired.replace(/' \+\s*\n\s*'/g, '');
                    repaired = repaired.replace(/" \+\s*\n\s*"/g, '');
                    // collapse newlines
                    repaired = repaired.replace(/\r?\n/g, ' ');
                    // attempt to convert JS-like object literal to JSON
                    repaired = repaired.replace(/([\w$-]+)\s*:/g, '"$1":');
                    repaired = repaired.replace(/'/g, '"');
                    repaired = repaired.replace(/,\s*([}\]])/g, '$1');
                    const parsed = JSON.parse(repaired);
                    projectData.educationalContent = parsed;
                } catch (e) {
                    // leave as-is and let sanitize try more conservative parsing
                    projectData.educationalContent = projectData.educationalContent;
                }
            }
            projectData.educationalContent = sanitize(projectData.educationalContent);
            try { console.log('DEBUG: sanitized educationalContent type:', typeof projectData.educationalContent, 'value:', JSON.stringify(projectData.educationalContent).slice(0,1000)); } catch (e) { console.log('DEBUG: unable to stringify sanitized educationalContent'); }
            // write sanitized copy for inspection
            try {
                fs.writeFileSync(path.join(__dirname, 'sanitized_ec_debug.json'), JSON.stringify(projectData.educationalContent, null, 2));
            } catch (e) {
                console.error('Failed to write sanitized_ec_debug.json', e && e.message);
            }
        }
        // Ensure all required fields have values to prevent MongoDB validation errors
        if (!projectData.title || !String(projectData.title).trim()) {
            projectData.title = 'Untitled Project';
        }
        if (!projectData.subtitle || !String(projectData.subtitle).trim()) {
            projectData.subtitle = 'No subtitle provided';
        }
        if (!projectData.description || !String(projectData.description).trim()) {
            projectData.description = 'No description provided';
        }
        if (!projectData.detailedDescription || !String(projectData.detailedDescription).trim()) {
            projectData.detailedDescription = projectData.description;
        }
        if (!projectData.category) {
            projectData.category = 'ai-ml';
        }        // Ensure educationalContent exists and has default structure
        if (!projectData.educationalContent || typeof projectData.educationalContent !== 'object') {
            projectData.educationalContent = {
                beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
                intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
                advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] }
            };
        }
        console.log('[createProject] Final validated data prepared for save');        console.log('[createProject] Creating project with data:', { title: projectData.title, subtitle: projectData.subtitle, description: projectData.description?.substring(0, 50), detailedDescription: projectData.detailedDescription?.substring(0, 50), category: projectData.category });
        const project = new Project_1.default(projectData);
        console.log('[createProject] Project instance created, attempting save...');
        await project.save();
        console.log('[createProject] Project saved successfully with id:', project._id);
        // Log what was actually saved to DB
        if (project?.educationalContent) {
            const ec = project.educationalContent;
            ['beginner', 'intermediate', 'advanced'].forEach(level => {
                const lvl = ec[level];
                if (lvl?.concepts) {
                    console.log(`[createProject] ${level} concepts SAVED IN DB:`, lvl.concepts.map((c, i) => ({
                        index: i,
                        title: c?.title,
                        hasDescription: !!c?.description,
                        descIsArray: Array.isArray(c?.description),
                        descLength: Array.isArray(c?.description) ? c.description.length : 'N/A',
                        descContent: c?.description ? JSON.stringify(c.description).substring(0, 200) : 'none'
                    })));
                }
            });
        }
        res.status(201).json({
            success: true,
            data: project,
            message: 'Project created successfully'
        });
                // Incrementally add project to RAG index (best-effort, non-blocking)
                try {
                    const doc = { source: 'project', id: project._id, text: [project.title, project.description, (project.tags || []).join(' ')].filter(Boolean).join('\n'), keywords: project.tags || [] };
                    ragService.addOrUpdateDoc(doc).catch(e => console.warn('[RAG] addOrUpdateDoc failed after createProject', e && e.message ? e.message : e));
                } catch (e) { }
    }
    catch (error) {
        console.error('[createProject] Error caught:', error instanceof Error ? error.message : error);
        if (error instanceof Error) {
            console.error('[createProject] Error stack:', error.stack);
        }
        
        // Extract detailed validation errors
        let detailedErrors = {};
        let errorMessage = 'Error creating project';
        
        if (error && typeof error === 'object') {
            // Handle Mongoose ValidationError
            if (error.name === 'ValidationError' && error.errors) {
                errorMessage = 'Project validation failed';
                Object.keys(error.errors).forEach(field => {
                    const err = error.errors[field];
                    detailedErrors[field] = err.message || String(err);
                });
            }
            // Handle other errors
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
        }
        
        res.status(400).json({
            success: false,
            message: errorMessage,
            error: error instanceof Error ? error.message : String(error),
            details: Object.keys(detailedErrors).length > 0 ? detailedErrors : undefined,
            validation: Object.keys(detailedErrors).length > 0 ? detailedErrors : undefined
        });
    }
};
exports.createProject = createProject;
// Update project (admin only)
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = req.body;
        console.log('[updateProject] REQUEST BODY RECEIVED:', JSON.stringify(updateData, null, 2).substring(0, 3000));
        if (updateData?.educationalContent) {
            const ec = updateData.educationalContent;
            ['beginner', 'intermediate', 'advanced'].forEach(level => {
                const lvl = ec[level];
                if (lvl?.concepts) {
                    console.log(`[updateProject] ${level} concepts in request:`, lvl.concepts.map((c, i) => ({
                        index: i,
                        title: c?.title,
                        hasDescription: !!c?.description,
                        descIsArray: Array.isArray(c?.description),
                        descLength: Array.isArray(c?.description) ? c.description.length : 'N/A',
                        descContent: c?.description ? JSON.stringify(c.description).substring(0, 200) : 'none'
                    })));
                }
            });
        }
        // Sanitize educationalContent same as create
        if (updateData && updateData.educationalContent && typeof updateData.educationalContent === 'object') {
            // reuse sanitize from above by inlining similar logic
            const tryParse = (v) => {
                if (typeof v !== 'string') return v;
                try {
                    return JSON.parse(v);
                }
                catch (e) {
                    // Attempt repair similar to create above
                    const tryRepair = (str) => {
                        try {
                            let t = String(str).replace(/\r?\n/g, ' ').trim();
                            if (!/[\{:]/.test(t)) return null;
                            t = t.replace(/([\w$-]+)\s*:/g, '"$1":');
                            t = t.replace(/'/g, '"');
                            t = t.replace(/,\s*([\}\]])/g, '$1');
                            return JSON.parse(t);
                        }
                        catch (e2) { return null; }
                    };
                    const repaired = tryRepair(v);
                    if (repaired !== null) return repaired;
                    const byNewline = v.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                    if (byNewline.length > 1) return byNewline;
                    const byComma = v.split(',').map(s => s.trim()).filter(Boolean);
                    if (byComma.length > 1) return byComma;
                    return [v];
                }
            };
            const levels = ['beginner', 'intermediate', 'advanced'];
            const out = {};
            levels.forEach(lvl => {
                const src = updateData.educationalContent[lvl] || {};
                const concepts = Array.isArray(src.concepts) ? src.concepts : tryParse(src.concepts || src.keyConcepts || []) || [];
                // Preserve description field from concepts (ConceptBlock array for uploaded/rich content)
                const preservedConcepts = concepts.map((c) => {
                    if (!c || typeof c !== 'object') return { title: c || '', description: [], images: [], videos: [], diagrams: [] };
                    return {
                        title: c.title || '',
                        description: Array.isArray(c.description) ? c.description : (c.description ? [c.description] : []),
                        images: Array.isArray(c.images) ? c.images : (c.images ? [c.images] : []),
                        videos: Array.isArray(c.videos) ? c.videos : (c.videos ? [c.videos] : []),
                        diagrams: Array.isArray(c.diagrams) ? c.diagrams : (c.diagrams ? [c.diagrams] : [])
                    };
                });
                out[lvl] = {
                    summary: src.summary || src.overview || '',
                    keyConcepts: Array.isArray(src.keyConcepts) ? src.keyConcepts : preservedConcepts.map((c) => c.title),
                    realWorldApplications: Array.isArray(src.realWorldApplications) ? src.realWorldApplications : (Array.isArray(src.prerequisites) ? src.prerequisites : tryParse(src.prerequisites || '') || []),
                    methodology: src.methodology || src.overview || '',
                    technicalApproach: src.technicalApproach || '',
                    challenges: Array.isArray(src.challenges) ? src.challenges : [],
                    solutions: Array.isArray(src.solutions) ? src.solutions : [],
                    implementation: src.implementation || src.overview || '',
                    performanceMetrics: Array.isArray(src.performanceMetrics) ? src.performanceMetrics : [],
                    researchContributions: Array.isArray(src.researchContributions) ? src.researchContributions : [],
                    futureWork: Array.isArray(src.futureWork) ? src.futureWork : [],
                    // keep rich fields
                    overview: src.overview || '',
                    prerequisites: Array.isArray(src.prerequisites) ? src.prerequisites : tryParse(src.prerequisites || '') || [],
                    concepts: preservedConcepts,
                    resources: (function(){
                        const rawResources = Array.isArray(src.resources) ? src.resources : tryParse(src.resources || '') || [];
                        const parseResourceLine = (line) => {
                            if (!line || typeof line !== 'string') return null;
                            const s = line.trim();
                            if (s.includes('::')) {
                                const parts = s.split('::').map(p => p.trim());
                                if (parts.length >= 3) return { title: parts[0], url: parts[1], type: parts[2] };
                                return null;
                            }
                            try {
                                let t = s.replace(/\r?\n/g, ' ').trim();
                                t = t.replace(/([\w$-]+)\s*:/g, '"$1":');
                                t = t.replace(/'/g, '"');
                                t = t.replace(/,\s*([}\]])/g, '$1');
                                const parsed = JSON.parse(t);
                                if (parsed && typeof parsed === 'object') return parsed;
                            } catch (e) { }
                            return null;
                        };
                        const resourcesArr = [];
                        if (Array.isArray(rawResources)) {
                            rawResources.forEach(r => {
                                if (!r && r !== 0) return;
                                if (typeof r === 'string') {
                                    const parsed = parseResourceLine(r);
                                    if (parsed) resourcesArr.push(parsed);
                                }
                                else if (r && typeof r === 'object') {
                                    resourcesArr.push({ title: r.title || '', url: r.url || '', type: r.type || '' });
                                }
                            });
                        }
                        return resourcesArr;
                    })(),
                    quizzes: (function(){
                        const rawQuizzes = Array.isArray(src.quizzes) ? src.quizzes : tryParse(src.quizzes || '') || [];
                        const parseQuizLine = (line) => {
                            if (!line || typeof line !== 'string') return null;
                            const s = line.trim();
                            if (s.includes('||')) {
                                const parts = s.split('||').map(p => p.trim()).filter(Boolean);
                                if (parts.length < 4) return null;
                                const question = parts[0];
                                let answerIndex = null;
                                let answerPos = -1;
                                for (let i = parts.length - 1; i >= 1; i--) {
                                    const num = parseInt(parts[i], 10);
                                    if (!Number.isNaN(num)) {
                                        answerIndex = num;
                                        answerPos = i;
                                        break;
                                    }
                                }
                                if (answerIndex === null) return null;
                                const options = parts.slice(1, answerPos);
                                const explanations = parts.slice(answerPos + 1);
                                return { question, options, answer: answerIndex, explanations };
                            }
                            try {
                                let t = s.replace(/\r?\n/g, ' ').trim();
                                t = t.replace(/([\w$-]+)\s*:/g, '"$1":');
                                t = t.replace(/'/g, '"');
                                t = t.replace(/,\s*([}\]])/g, '$1');
                                const parsed = JSON.parse(t);
                                if (parsed && typeof parsed === 'object') return parsed;
                            } catch (e) { }
                            return null;
                        };
                        const quizzesArr = [];
                        if (Array.isArray(rawQuizzes)) {
                            rawQuizzes.forEach(q => {
                                if (!q && q !== 0) return;
                                if (typeof q === 'string') {
                                    const parsed = parseQuizLine(q);
                                    if (parsed) quizzesArr.push(parsed);
                                }
                                else if (q && typeof q === 'object') {
                                    // Coerce answer to number and normalize arrays
                                    let ans = 0;
                                    try { const num = Number(q.answer); ans = Number.isFinite(num) ? num : 0; } catch (e) { ans = 0; }
                                    const opts = Array.isArray(q.options) ? q.options.map(o => String(o)) : [];
                                    const exps = Array.isArray(q.explanations) ? q.explanations.map(e => String(e)) : [];
                                    quizzesArr.push({ question: q.question || '', options: opts, answer: ans, explanations: exps });
                                }
                            });
                        }
                        return quizzesArr;
                    })(),
                };
            });
            updateData = { ...updateData, educationalContent: out };
        }
        const project = await Project_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        // Log what was actually saved to DB
        if (project?.educationalContent) {
            const ec = project.educationalContent;
            ['beginner', 'intermediate', 'advanced'].forEach(level => {
                const lvl = ec[level];
                if (lvl?.concepts) {
                    console.log(`[updateProject] ${level} concepts SAVED IN DB:`, lvl.concepts.map((c, i) => ({
                        index: i,
                        title: c?.title,
                        hasDescription: !!c?.description,
                        descIsArray: Array.isArray(c?.description),
                        descLength: Array.isArray(c?.description) ? c.description.length : 'N/A',
                        descContent: c?.description ? JSON.stringify(c.description).substring(0, 200) : 'none'
                    })));
                }
            });
        }
        res.json({
            success: true,
            data: project,
            message: 'Project updated successfully'
        });
                try {
                    const doc = { source: 'project', id: project._id, text: [project.title, project.description, (project.tags || []).join(' ')].filter(Boolean).join('\n'), keywords: project.tags || [] };
                    ragService.addOrUpdateDoc(doc).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateProject', e && e.message ? e.message : e));
                } catch (e) { }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating project',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateProject = updateProject;
// Delete project (admin only)
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project_1.default.findByIdAndDelete(id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
        try { ragService.removeDoc('project', id).catch(e => console.warn('[RAG] removeDoc failed after deleteProject', e && e.message ? e.message : e)); } catch (e) { }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting project',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteProject = deleteProject;
// Get featured projects
const getFeaturedProjects = async (req, res) => {
    try {
        const projects = await Project_1.default.find({ featured: true })
            .select('-educationalContent')
            .sort({ createdAt: -1 })
            .limit(6);
        res.json({
            success: true,
            data: projects
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured projects',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFeaturedProjects = getFeaturedProjects;
// Get projects by category
const getProjectsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const projects = await Project_1.default.find({ category })
            .select('-educationalContent')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: projects
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching projects by category',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getProjectsByCategory = getProjectsByCategory;
//# sourceMappingURL=projectController.js.map
