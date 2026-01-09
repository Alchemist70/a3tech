"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const ProjectSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    detailedDescription: {
        type: String,
        required: true
    },
    technicalDetails: {
        technologies: [String],
        methodologies: [String],
        algorithms: [String],
        datasets: [String]
    },
    educationalContent: {
        beginner: {
            // legacy fields
            summary: String,
            keyConcepts: [String],
            realWorldApplications: [String],
            // frontend-rich fields (kept for compatibility)
            overview: String,
            prerequisites: [String],
            concepts: [{
                title: String,
                // concept descriptions are rich blocks (stored as Mixed to allow objects/strings)
                description: [{ type: mongoose_1.Schema.Types.Mixed }],
                images: [String],
                videos: [String],
                diagrams: [String]
            }],
            resources: [{
                title: { type: String },
                url: { type: String },
                type: { type: String }
            }],
            quizzes: [{
                question: String,
                options: [String],
                answer: String,
                explanations: [String]
            }]
        },
        intermediate: {
            // legacy fields
            methodology: String,
            technicalApproach: String,
            challenges: [String],
            solutions: [String],
            // frontend-rich fields
            overview: String,
            prerequisites: [String],
            concepts: [{
                title: String,
                description: [{ type: mongoose_1.Schema.Types.Mixed }],
                images: [String],
                videos: [String],
                diagrams: [String]
            }],
            resources: [{
                title: { type: String },
                url: { type: String },
                type: { type: String }
            }],
            quizzes: [{
                question: String,
                options: [String],
                answer: String,
                explanations: [String]
            }]
        },
        advanced: {
            // legacy fields
            implementation: String,
            performanceMetrics: [String],
            researchContributions: [String],
            futureWork: [String],
            // frontend-rich fields
            overview: String,
            prerequisites: [String],
            concepts: [{
                title: String,
                description: [{ type: mongoose_1.Schema.Types.Mixed }],
                images: [String],
                videos: [String],
                diagrams: [String]
            }],
            resources: [{
                title: { type: String },
                url: { type: String },
                type: { type: String }
            }],
            quizzes: [{
                question: String,
                options: [String],
                answer: String,
                explanations: [String]
            }]
        }
    },
    media: {
        images: [String],
        videos: [String],
        diagrams: [String],
        codeSnippets: [String]
    },
    publications: [{
            title: String,
            authors: [String],
            venue: String,
            year: Number,
            doi: String,
            status: {
                type: String,
                enum: ['published', 'submitted', 'under-review', 'preprint'],
                default: 'preprint'
            }
        }],
    githubUrl: String,
    demoUrl: String,
    category: {
        type: String,
        required: true
    },
    tags: [String],
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Index for search functionality
ProjectSchema.index({
    title: 'text',
    description: 'text',
    'technicalDetails.technologies': 'text',
    tags: 'text'
});
exports.default = mongoose_1.default.model('Project', ProjectSchema);
//# sourceMappingURL=Project.js.map
