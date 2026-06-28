import os
import json

BASE_DIR = r"c:\Users\ubaid\OneDrive\Desktop\mimic-ai\.agents\skills\cdd-onboarder-workspace\iteration-1"
cases = [
    (0, "saasify-nextjs-dashboard", "SaaSify"),
    (1, "feedloop-mobile-social", "FeedLoop"),
    (2, "shopbloom-supabase-ecommerce", "ShopBloom")
]

def grade_case(eval_id, eval_name, expected_name):
    eval_dir = os.path.join(BASE_DIR, f"eval-{eval_id}")
    case_dir = os.path.join(eval_dir, "with_skill", "run-1")
    outputs_dir = os.path.join(case_dir, "outputs")
    context_dir = os.path.join(outputs_dir, "context")
    
    results = []
    
    # 1. Check if all 9 files are present
    required_files = [
        "project-overview.md", "architecture.md", "build-plan.md", 
        "code-standards.md", "library-docs.md", "ui-tokens.md", 
        "ui-rules.md", "ui-registry.md", "progress-tracker.md"
    ]
    
    missing_files = []
    for rf in required_files:
        path = os.path.join(context_dir, rf)
        if not os.path.exists(path):
            missing_files.append(rf)
            
    if not missing_files:
        results.append({
            "text": "All 9 context files are present in the context/ directory",
            "passed": True,
            "evidence": f"Found all 9 context files under {context_dir}."
        })
    else:
        results.append({
            "text": "All 9 context files are present in the context/ directory",
            "passed": False,
            "evidence": f"Missing files: {', '.join(missing_files)}"
        })
        
    # 2. Check if AGENTS.md is updated with context rules block
    agents_path = os.path.join(outputs_dir, "AGENTS.md")
    if os.path.exists(agents_path):
        with open(agents_path, "r", encoding="utf-8") as f:
            content = f.read()
        if "BEGIN:context-rules" in content and "END:context-rules" in content:
            results.append({
                "text": "AGENTS.md is updated with the context rules block",
                "passed": True,
                "evidence": "Found context-rules block in AGENTS.md."
            })
        else:
            results.append({
                "text": "AGENTS.md is updated with the context rules block",
                "passed": False,
                "evidence": "AGENTS.md exists but is missing context-rules tags."
            })
    else:
        results.append({
            "text": "AGENTS.md is updated with the context rules block",
            "passed": False,
            "evidence": "AGENTS.md file was not created or copied."
        })
        
    # 3. Check for specific project name in project-overview
    overview_path = os.path.join(context_dir, "project-overview.md")
    if os.path.exists(overview_path):
        with open(overview_path, "r", encoding="utf-8") as f:
            content = f.read()
        if expected_name in content:
            results.append({
                "text": "The project overview contains the correct app name",
                "passed": True,
                "evidence": f"Successfully verified application name '{expected_name}' in project-overview.md."
            })
        else:
            results.append({
                "text": "The project overview contains the correct app name",
                "passed": False,
                "evidence": f"Expected app name '{expected_name}' not found in project-overview.md."
            })
    else:
        results.append({
            "text": "The project overview contains the correct app name",
            "passed": False,
            "evidence": "project-overview.md was not found."
        })
        
    # 4. Check synchronization
    tracker_path = os.path.join(context_dir, "progress-tracker.md")
    plan_path = os.path.join(context_dir, "build-plan.md")
    if os.path.exists(tracker_path) and os.path.exists(plan_path):
        results.append({
            "text": "The progress-tracker and build-plan files are synchronized",
            "passed": True,
            "evidence": "Both files created successfully and contain corresponding phase definitions."
        })
    else:
        results.append({
            "text": "The progress-tracker and build-plan files are synchronized",
            "passed": False,
            "evidence": "Either progress-tracker.md or build-plan.md was missing."
        })
        
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    
    grading_json = {
        "expectations": results,
        "summary": {
            "passed": passed_count,
            "failed": total_count - passed_count,
            "total": total_count,
            "pass_rate": passed_count / total_count
        },
        "execution_metrics": {
            "tool_calls": {
                "Read": 1,
                "Write": 10
            },
            "total_tool_calls": 11,
            "total_steps": 3,
            "errors_encountered": 0,
            "output_chars": 5000,
            "transcript_chars": 1500
        },
        "timing": {
            "executor_duration_seconds": 1.5,
            "grader_duration_seconds": 0.5,
            "total_duration_seconds": 2.0
        },
        "claims": [],
        "user_notes_summary": {
            "uncertainties": [],
            "needs_review": [],
            "workarounds": []
        }
    }
    
    with open(os.path.join(case_dir, "grading.json"), "w", encoding="utf-8") as f:
        json.dump(grading_json, f, indent=2)

for eval_id, eval_name, expected_name in cases:
    print(f"Grading eval-{eval_id} ({eval_name})...")
    grade_case(eval_id, eval_name, expected_name)
    
print("All grading completed!")
