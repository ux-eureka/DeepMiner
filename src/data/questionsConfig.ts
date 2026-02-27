export interface PhaseConfig {
  title: string;
  type: 'static_batch' | 'dynamic_inject';
  extract_variables?: string[];
  questions: string[];
}

export interface ModeConfig {
  mode_id: string;
  mode_name: string;
  phases: Record<string, PhaseConfig>;
}

export const QUESTIONS_CONFIG: Record<string, ModeConfig> = {
  "b_side_efficiency": {
    "mode_id": "b_side_efficiency",
    "mode_name": "B端：业务流转与合规",
    "phases": {
      "1": {
        "title": "业务基座 (Context)",
        "type": "static_batch",
        "extract_variables": ["buyer_department", "user_role", "core_asset"],
        "questions": [
          "1.1 这个系统最终是卖给什么公司的？或者它是公司内部哪个部门在用？",
          "1.2 报出这个系统里产生交互的真实岗位名称（禁止说'用户'，要是具体的职位，如'仓库分拣员'）。",
          "1.3 在这个页面上，他们到底在处理什么具体的东西（核心单据/资产，如'出库单'）？"
        ]
      },
      "2": {
        "title": "业务恐惧 (Fear)",
        "type": "dynamic_inject",
        "extract_variables": ["fatal_mistake", "frequent_action"],
        "questions": [
          "2.1 【{{buyer_department}}】的老板/业务方在这个环节，最怕发生什么致命失误（导致赔钱或违规）？",
          "2.2 刚才你提到的【{{user_role}}】，在处理【{{core_asset}}】时，界面的哪个具体'物理动作'（重复/繁琐），最容易引发老板害怕的那个失误？"
        ]
      },
      "3": {
        "title": "核心冲突 (Conflict)",
        "type": "dynamic_inject",
        "extract_variables": ["boss_requirement", "worker_shortcut", "conflict_point"],
        "questions": [
          "3.1 老板为了防止【{{fatal_mistake}}】，提出了什么硬性的物理要求？",
          "3.2 【{{user_role}}】为了偷懒或快点搞定【{{frequent_action}}】这个动作，本能地想怎么操作？",
          "3.3 这两者的诉求，在界面的哪一个具体按钮或流程上直接打架了？"
        ]
      },
      "4": {
        "title": "竞品与限制 (Constraints)",
        "type": "dynamic_inject",
        "extract_variables": ["competitor_reference", "business_constraint"],
        "questions": [
          "4.1 做这个页面前，你参考了哪个外部软件的真实截图来解决【{{conflict_point}}】的冲突？",
          "4.2 你们的数据结构、硬件限制或业务特殊性，导致你为什么不能直接照抄竞品？"
        ]
      },
      "5": {
        "title": "物理手术 (Action)",
        "type": "dynamic_inject",
        "extract_variables": ["before_surgery", "after_surgery"],
        "questions": [
          "5.1 改版前，【{{user_role}}】完成这个任务要经历怎样的物理折磨（用步数或动作描述）？",
          "5.2 你在界面上做了什么具体的'物理限制'或'物理引导'来解决冲突，并适应【{{business_constraint}}】的限制？（例如：把输入框改成下拉框，或者加了高亮）"
        ]
      },
      "6": {
        "title": "数据验尸 (Metrics)",
        "type": "dynamic_inject",
        "extract_variables": [],
        "questions": [
          "6.1 这个核心任务的平均操作步骤，从几步降到了几步？",
          "6.2 那些让老板害怕的【{{fatal_mistake}}】（如退单率/填错率），具体降低了多少？"
        ]
      }
    }
  },
  "c_side_growth": {
    "mode_id": "c_side_growth",
    "mode_name": "C端：流量变现与增长",
    "phases": {
      "1": {
        "title": "商业基座 (Context)",
        "type": "static_batch",
        "extract_variables": ["business_goal", "user_desire"],
        "questions": [
          "1.1 这个页面最终要帮公司捞到什么具体商业好处（GMV/拉新/广告曝光）？",
          "1.2 用户滑到这个页面时，他脑子里最原始的欲望是什么（贪便宜/看美女/杀时间）？"
        ]
      },
      "2": {
        "title": "欲望流失 (Drop-off)",
        "type": "dynamic_inject",
        "extract_variables": ["drop_off_moment", "physical_friction"],
        "questions": [
          "2.1 在实现【{{business_goal}}】的路上，用户在哪一秒钟最容易关掉页面跑路？",
          "2.2 促使他跑路的具体物理阻力是什么（找不到按钮/价格太高/流程太长）？"
        ]
      },
      "3": {
        "title": "利益冲突 (Conflict)",
        "type": "dynamic_inject",
        "extract_variables": ["platform_action", "user_shortcut", "conflict_zone"],
        "questions": [
          "3.1 平台希望用户多做什么动作来促成【{{business_goal}}】？",
          "3.2 用户为了满足【{{user_desire}}】又想省事，本能地想少做什么动作？",
          "3.3 平台的赚钱欲望和用户的白嫖欲望，在屏幕的哪个区域（比如支付弹窗、会员引导条）发生了正面冲突？"
        ]
      },
      "4": {
        "title": "竞品与套路 (Reference)",
        "type": "dynamic_inject",
        "extract_variables": ["competitor_trick", "resource_constraint"],
        "questions": [
          "4.1 你参考了哪个App的成熟套路（如拼多多的砍一刀、美团的倒计时）来解决这个冲突？",
          "4.2 你们的开发资源或业务模式限制，导致你放弃了哪些激进的诱导设计？"
        ]
      },
      "5": {
        "title": "视觉手术 (Action)",
        "type": "dynamic_inject",
        "extract_variables": ["before_surgery", "after_surgery"],
        "questions": [
          "5.1 改版前，这个转化路径在【{{conflict_zone}}】有什么物理硬伤导致用户跑路？",
          "5.2 你在界面上放了什么'视觉诱饵'或设置了什么'物理阻力'来强行留住他，并规避【{{resource_constraint}}】？"
        ]
      },
      "6": {
        "title": "转化验尸 (Metrics)",
        "type": "dynamic_inject",
        "extract_variables": [],
        "questions": [
          "6.1 改版后，关键按钮的点击率（CTR）涨了几个点？",
          "6.2 最终关于【{{business_goal}}】的核心转化率（付费/注册）提升了多少？"
        ]
      }
    }
  }
};
