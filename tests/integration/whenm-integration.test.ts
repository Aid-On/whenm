import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockWhenM } from './test-setup';

/**
 * 結合テスト: WhenM 時間認識メモリシステム
 * 
 * このテストスイートは、実際の利用シナリオに基づいて
 * WhenMシステム全体の統合動作を検証します。
 */
describe('WhenM Integration Tests', () => {
  let whenm: any;

  beforeEach(async () => {
    // Mock実装を使用
    whenm = createMockWhenM();
  });

  afterEach(async () => {
    // テスト間の干渉を防ぐためリセット
    if (whenm) {
      await whenm.reset();
    }
  });

  describe('企業の人事履歴シナリオ', () => {
    it('should track employee career progression over time', async () => {
      // 従業員のキャリアパスを記録
      await whenm.remember('Alice joined the company', '2020-01-15');
      await whenm.remember('Alice completed onboarding', '2020-01-20');
      await whenm.remember('Alice learned Python', '2020-06-10');
      await whenm.remember('Alice learned TypeScript', '2020-09-15');
      await whenm.remember('Alice became team lead', '2021-03-01');
      await whenm.remember('Alice promoted to Senior Engineer', '2022-01-10');
      await whenm.remember('Bob joined as Junior Developer', '2021-06-01');
      await whenm.remember('Bob learned React', '2021-09-15');
      await whenm.remember('Charlie joined as Data Scientist', '2022-03-15');
      
      // 質問に答える
      const whatAliceLearned = await whenm.ask('What did Alice learn?');
      expect(whatAliceLearned).toContain('Python');
      
      // 時系列クエリ
      const events2021 = await whenm.search('', {
        from: '2021-01-01',
        to: '2021-12-31'
      });
      expect(events2021.length).toBeGreaterThanOrEqual(3); // Alice became team lead, Bob joined, Bob learned React
      
      // 特定人物のタイムライン
      const aliceTimeline = await whenm.timeline('Alice')
        .between('2020-01-01', '2022-12-31');
      expect(aliceTimeline).toBeDefined();
      
      // 複雑なクエリビルダー
      const seniorEngineers = await whenm.query()
        .verb('promoted')
        .execute();
      expect(seniorEngineers.some(e => e.subject === 'Alice')).toBe(true);
    });

    it('should handle compound events and role transitions', async () => {
      // 複合イベント: 同時に複数の変化
      await whenm.remember('Nancy joined as Product Manager and leads growth team', '2022-07-01');
      
      // ロール変更の追跡
      await whenm.remember('David joined as Intern', '2022-01-10');
      await whenm.remember('David became Junior Developer', '2022-07-10');
      await whenm.remember('David promoted to Developer', '2023-01-15');
      
      // 現在の役割を確認
      const davidRole = await whenm.ask('What is David?', '2023-06-01');
      expect(davidRole).toContain('Developer');
      
      // 過去の時点での役割
      const davidPastRole = await whenm.ask('What was David?', '2022-03-01');
      expect(davidPastRole).toContain('Intern');
    });
  });

  describe('プロジェクト管理シナリオ', () => {
    it('should track project milestones and deliverables', async () => {
      // プロジェクトのマイルストーン
      await whenm.remember('Project Alpha started', '2023-01-10');
      await whenm.remember('Alice assigned to Project Alpha', '2023-01-11');
      await whenm.remember('Bob assigned to Project Alpha', '2023-01-11');
      await whenm.remember('Project Alpha design completed', '2023-02-15');
      await whenm.remember('Project Alpha development started', '2023-02-20');
      await whenm.remember('Charlie joined Project Alpha', '2023-03-01');
      await whenm.remember('Project Alpha testing started', '2023-04-10');
      await whenm.remember('Project Alpha launched', '2023-05-01');
      await whenm.remember('Project Alpha received customer feedback', '2023-05-15');
      
      // プロジェクトの状態を時系列で確認
      const projectStatus = await whenm.search('Project Alpha', {
        from: '2023-01-01',
        to: '2023-06-01'
      });
      expect(projectStatus.length).toBeGreaterThanOrEqual(8);
      
      // 特定時点でのプロジェクトメンバー
      const members = await whenm.search('assigned', {
        from: '2023-01-01',
        to: '2023-03-31'
      });
      expect(members.some(e => e.subject === 'Alice')).toBe(true);
      expect(members.some(e => e.subject === 'Bob')).toBe(true);
      expect(members.some(e => e.subject === 'Charlie')).toBe(true);
    });

    it('should handle parallel projects and resource allocation', async () => {
      // 複数プロジェクトの並行管理
      await whenm.remember('Project X started', '2023-01-01');
      await whenm.remember('Project Y started', '2023-02-01');
      await whenm.remember('Alice assigned to Project X', '2023-01-02');
      await whenm.remember('Alice assigned to Project Y', '2023-02-02'); // アリスは両方に参加
      await whenm.remember('Bob dedicated to Project X', '2023-01-02');
      await whenm.remember('Charlie dedicated to Project Y', '2023-02-02');
      
      // アリスの稼働状況
      const aliceProjects = await whenm.search('Alice assigned');
      expect(aliceProjects).toHaveLength(2);
      
      // プロジェクトXのメンバー
      const projectXTeam = await whenm.query()
        .verb('assigned')
        .object('Project X')
        .execute();
      expect(projectXTeam.some(e => e.subject === 'Alice')).toBe(true);
      expect(projectXTeam.some(e => e.subject === 'Bob')).toBe(true);
    });
  });

  describe('スキル習得と技術スタック管理', () => {
    it('should track skill acquisition and technology adoption', async () => {
      // 技術習得の履歴
      const skills = [
        { who: 'Alice', what: 'React', when: '2022-01-10' },
        { who: 'Alice', what: 'Node.js', when: '2022-03-15' },
        { who: 'Alice', what: 'Kubernetes', when: '2022-06-20' },
        { who: 'Bob', what: 'Python', when: '2022-02-01' },
        { who: 'Bob', what: 'Django', when: '2022-04-10' },
        { who: 'Bob', what: 'FastAPI', when: '2022-07-15' },
        { who: 'Charlie', what: 'TensorFlow', when: '2022-03-01' },
        { who: 'Charlie', what: 'PyTorch', when: '2022-05-15' },
      ];
      
      for (const skill of skills) {
        await whenm.remember(`${skill.who} learned ${skill.what}`, skill.when);
      }
      
      // 特定人物のスキルセット
      const aliceSkills = await whenm.query()
        .subject('Alice')
        .verb('learned')
        .execute();
      expect(aliceSkills).toHaveLength(3);
      expect(aliceSkills.map(s => s.object)).toContain('React');
      expect(aliceSkills.map(s => s.object)).toContain('Kubernetes');
      
      // 特定技術を持つ人を検索
      const pythonDevelopers = await whenm.search('Python');
      expect(pythonDevelopers.some(e => e.subject === 'Bob')).toBe(true);
      
      // 時系列でのスキル習得パターン
      const q1Skills = await whenm.search('learned', {
        from: '2022-01-01',
        to: '2022-03-31'
      });
      expect(q1Skills.length).toBeGreaterThanOrEqual(3);
    });

    it('should identify skill gaps and learning paths', async () => {
      // チームの現在のスキル
      await whenm.remember('Team needs React developers', '2023-01-01');
      await whenm.remember('Alice knows React', '2023-01-02');
      await whenm.remember('Bob learning React', '2023-01-15');
      await whenm.remember('Charlie interested in React', '2023-02-01');
      
      // スキルギャップ分析
      const reactStatus = await whenm.search('React');
      const knowers = reactStatus.filter(e => e.verb === 'knows');
      const learners = reactStatus.filter(e => e.verb === 'learning');
      const interested = reactStatus.filter(e => e.verb === 'interested');
      
      expect(knowers.length).toBeGreaterThanOrEqual(1);
      expect(learners.length).toBeGreaterThanOrEqual(1);
      expect(interested.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('自然言語クエリチェーン', () => {
    it('should handle complex natural language query chains', async () => {
      // セットアップ: 複雑な組織構造
      await whenm.remember('Alice joined as Engineer', '2020-01-01');
      await whenm.remember('Alice became Senior Engineer', '2021-01-01');
      await whenm.remember('Alice became Tech Lead', '2022-01-01');
      await whenm.remember('Alice manages Frontend Team', '2022-06-01');
      await whenm.remember('Bob reports to Alice', '2022-06-15');
      await whenm.remember('Charlie reports to Alice', '2022-07-01');
      await whenm.remember('Diana joined Backend Team', '2022-08-01');
      await whenm.remember('Diana became Team Lead', '2023-01-01');
      
      // 自然言語クエリチェーン
      const queryChain = whenm.nl('Who became Team Lead?')
        .and('Who manages Frontend Team?')
        .and('Who reports to Alice?');
      
      const results = await queryChain.execute();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should answer complex temporal questions', async () => {
      // 時間依存のイベント
      await whenm.remember('Office opened in Tokyo', '2020-01-01');
      await whenm.remember('Office expanded to Osaka', '2021-06-01');
      await whenm.remember('Remote work policy started', '2020-03-15');
      await whenm.remember('Hybrid work model adopted', '2021-09-01');
      await whenm.remember('Office closed in Osaka', '2022-12-31');
      
      // 複雑な時間的質問
      const officeStatus2021 = await whenm.ask('What offices were operating?', '2021-12-01');
      expect(officeStatus2021).toBeDefined();
      
      const workPolicy2020 = await whenm.ask('What was the work policy?', '2020-06-01');
      expect(workPolicy2020).toContain('Remote');
      
      const workPolicy2022 = await whenm.ask('What is the work model?', '2022-01-01');
      expect(workPolicy2022).toContain('Hybrid');
    });
  });

  describe('知識のエクスポート/インポート', () => {
    it('should export and import knowledge base', async () => {
      // 知識ベースを構築
      await whenm.remember('System architecture designed', '2023-01-10');
      await whenm.remember('Database schema created', '2023-01-15');
      await whenm.remember('API endpoints defined', '2023-01-20');
      await whenm.remember('Security audit completed', '2023-02-01');
      
      // 知識をエクスポート
      const knowledge = whenm.exportKnowledge();
      expect(knowledge).toBeDefined();
      expect(typeof knowledge).toBe('string');
      
      // 新しいインスタンスを作成
      const newWhenm = createMockWhenM();
      
      // 知識をインポート
      newWhenm.importKnowledge(knowledge);
      
      // インポートされた知識を検証
      const events = await newWhenm.getEvents();
      expect(events.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('エラーハンドリングと境界条件', () => {
    it('should handle edge cases gracefully', async () => {
      // 空のイベント
      await whenm.remember('', '2023-01-01');
      
      // 非常に長いテキスト
      const longText = 'Alice learned ' + 'programming '.repeat(100);
      await whenm.remember(longText, '2023-01-02');
      
      // 特殊文字を含むイベント
      await whenm.remember('Bob learned C++ & Python @ Tech Conference', '2023-01-03');
      await whenm.remember('Charlie earned $100K bonus!', '2023-01-04');
      await whenm.remember('Diana joined 東京 office', '2023-01-05');
      
      // 無効な日付
      await whenm.remember('Event with invalid date', 'not-a-date');
      
      // すべてのイベントが記録されていることを確認
      const allEvents = await whenm.getEvents();
      expect(allEvents.length).toBeGreaterThanOrEqual(5);
      
      // 特殊文字での検索
      const cppResults = await whenm.search('C++');
      expect(cppResults).toBeDefined();
      
      const tokyoResults = await whenm.search('東京');
      expect(tokyoResults).toBeDefined();
    });

    it('should handle concurrent operations', async () => {
      // 並行して複数のイベントを記録
      const promises = [
        whenm.remember('Event 1', '2023-01-01'),
        whenm.remember('Event 2', '2023-01-02'),
        whenm.remember('Event 3', '2023-01-03'),
        whenm.remember('Event 4', '2023-01-04'),
        whenm.remember('Event 5', '2023-01-05'),
      ];
      
      await Promise.all(promises);
      
      // すべてのイベントが記録されていることを確認
      const events = await whenm.getEvents();
      expect(events.length).toBeGreaterThanOrEqual(5);
    });

    it('should maintain consistency after reset', async () => {
      // データを追加
      await whenm.remember('Important event', '2023-01-01');
      await whenm.remember('Another event', '2023-01-02');
      
      // リセット
      await whenm.reset();
      
      // リセット後は空になっているはず
      const eventsAfterReset = await whenm.getEvents();
      expect(eventsAfterReset).toEqual([]);
      
      // 新しいデータを追加できることを確認
      await whenm.remember('New event after reset', '2023-02-01');
      const newEvents = await whenm.getEvents();
      expect(newEvents).toHaveLength(1);
    });
  });

  describe('パフォーマンステスト', () => {
    it('should handle large dataset efficiently', async () => {
      const startTime = Date.now();
      
      // 100個のイベントを追加
      const events = [];
      for (let i = 0; i < 100; i++) {
        const date = new Date(2023, 0, 1 + i);
        events.push(
          whenm.remember(
            `Event ${i} occurred`,
            date.toISOString().split('T')[0]
          )
        );
      }
      
      await Promise.all(events);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 100イベントの処理が妥当な時間内に完了
      expect(duration).toBeLessThan(10000); // 10秒以内
      
      // 検索パフォーマンス
      const searchStart = Date.now();
      const results = await whenm.search('Event', { limit: 10 });
      const searchEnd = Date.now();
      const searchDuration = searchEnd - searchStart;
      
      expect(results).toHaveLength(10);
      expect(searchDuration).toBeLessThan(1000); // 1秒以内
    });
  });
});