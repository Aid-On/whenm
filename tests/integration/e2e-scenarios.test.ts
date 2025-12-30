import { describe, it, expect } from 'vitest';
import { createMockWhenM } from './test-setup';

/**
 * エンドツーエンド シナリオテスト
 * 
 * 実際のビジネスユースケースをシミュレートして
 * システム全体の動作を検証します。
 */
describe('E2E Scenarios', () => {
  
  describe('スタートアップの成長記録', () => {
    it('should track complete startup journey from founding to IPO', async () => {
      const whenm = createMockWhenM();

      // スタートアップの全履歴を記録
      const startupEvents = [
        // 2020: 創業期
        { event: 'TechCorp founded by Alice and Bob', date: '2020-01-15' },
        { event: 'Alice became CEO', date: '2020-01-15' },
        { event: 'Bob became CTO', date: '2020-01-15' },
        { event: 'TechCorp registered in Delaware', date: '2020-02-01' },
        { event: 'Charlie joined as first engineer', date: '2020-03-01' },
        { event: 'MVP launched', date: '2020-06-15' },
        { event: 'First customer acquired', date: '2020-07-01' },
        { event: 'TechCorp reached 10 customers', date: '2020-12-15' },
        
        // 2021: 成長期
        { event: 'Series A funding raised $5M', date: '2021-03-01' },
        { event: 'Diana joined as VP Engineering', date: '2021-04-01' },
        { event: 'Team expanded to 15 people', date: '2021-06-01' },
        { event: 'Product 2.0 released', date: '2021-09-15' },
        { event: 'TechCorp reached 100 customers', date: '2021-12-31' },
        
        // 2022: スケール期
        { event: 'Series B funding raised $20M', date: '2022-02-15' },
        { event: 'Office opened in Tokyo', date: '2022-04-01' },
        { event: 'Office opened in London', date: '2022-06-01' },
        { event: 'Emma joined as CFO', date: '2022-07-01' },
        { event: 'Team expanded to 50 people', date: '2022-09-01' },
        { event: 'Annual revenue reached $10M', date: '2022-12-31' },
        
        // 2023: IPO準備
        { event: 'Series C funding raised $50M', date: '2023-01-15' },
        { event: 'Frank joined as COO', date: '2023-03-01' },
        { event: 'Team expanded to 150 people', date: '2023-06-01' },
        { event: 'IPO filing submitted', date: '2023-09-01' },
        { event: 'TechCorp went public on NASDAQ', date: '2023-12-15' },
      ];

      // イベントを時系列で記録
      for (const item of startupEvents) {
        await whenm.remember(item.event, item.date);
      }

      // マイルストーンの検証
      
      // 1. 創業メンバーの確認
      const founders = await whenm.ask('Who founded TechCorp?');
      expect(founders).toContain('Alice');
      expect(founders).toContain('Bob');

      // 2. 資金調達の履歴
      const fundingEvents = await whenm.search('funding');
      expect(fundingEvents).toHaveLength(3);
      
      // 3. 成長の軌跡
      const customerMilestones = await whenm.search('customers');
      expect(customerMilestones.length).toBeGreaterThanOrEqual(2);
      
      // 4. グローバル展開
      const officeExpansion = await whenm.search('Office opened');
      expect(officeExpansion).toHaveLength(2);
      expect(officeExpansion.some(e => e.object?.includes('Tokyo'))).toBe(true);
      expect(officeExpansion.some(e => e.object?.includes('London'))).toBe(true);
      
      // 5. リーダーシップチームの変遷
      const cLevelExecs = await whenm.query()
        .verb('became')
        .execute();
      const cLevelRoles = cLevelExecs.filter(e => 
        e.object?.includes('CEO') || 
        e.object?.includes('CTO') || 
        e.object?.includes('CFO') || 
        e.object?.includes('COO')
      );
      expect(cLevelRoles.length).toBeGreaterThanOrEqual(4);
      
      // 6. 特定時点でのスナップショット
      const status2021 = await whenm.ask('What was the team size?', '2021-12-31');
      expect(status2021).toBeDefined();
      
      const status2022 = await whenm.ask('What was the annual revenue?', '2022-12-31');
      expect(status2022).toContain('10M');
      
      // 7. IPOまでの期間
      const ipoEvent = await whenm.search('went public');
      expect(ipoEvent).toHaveLength(1);
      expect(ipoEvent[0].date).toBe('2023-12-15');
      
      await whenm.reset();
    });
  });

  describe('製品開発ライフサイクル', () => {
    it('should track complete product development from ideation to sunset', async () => {
      const whenm = createMockWhenM();

      // 製品ライフサイクルの全フェーズ
      const productLifecycle = [
        // アイデア・企画フェーズ
        { event: 'Product X ideation started', date: '2021-01-10' },
        { event: 'Market research completed for Product X', date: '2021-02-15' },
        { event: 'Product X approved by board', date: '2021-03-01' },
        { event: 'Alice assigned as Product X product manager', date: '2021-03-05' },
        { event: 'Bob assigned as Product X tech lead', date: '2021-03-05' },
        
        // 設計フェーズ
        { event: 'Product X requirements gathering started', date: '2021-03-15' },
        { event: 'Product X architecture design completed', date: '2021-04-15' },
        { event: 'Product X UX design completed', date: '2021-05-01' },
        
        // 開発フェーズ
        { event: 'Product X development started', date: '2021-05-15' },
        { event: 'Product X alpha version completed', date: '2021-08-01' },
        { event: 'Product X beta testing started', date: '2021-09-01' },
        { event: 'Product X beta feedback incorporated', date: '2021-10-15' },
        
        // リリース・成長フェーズ
        { event: 'Product X launched to public', date: '2021-11-15' },
        { event: 'Product X reached 1000 users', date: '2021-12-31' },
        { event: 'Product X version 2.0 released', date: '2022-03-15' },
        { event: 'Product X reached 10000 users', date: '2022-06-30' },
        { event: 'Product X won industry award', date: '2022-09-15' },
        
        // 成熟・衰退フェーズ
        { event: 'Product X maintenance mode announced', date: '2023-01-15' },
        { event: 'Product X feature freeze implemented', date: '2023-03-01' },
        { event: 'Product X migration to Product Y started', date: '2023-06-01' },
        { event: 'Product X end-of-life announced', date: '2023-09-01' },
        { event: 'Product X discontinued', date: '2023-12-31' },
      ];

      // イベントを記録
      for (const item of productLifecycle) {
        await whenm.remember(item.event, item.date);
      }

      // 製品ライフサイクルの分析
      
      // 1. 開発期間の計算
      const developmentPhase = await whenm.search('Product X', {
        from: '2021-05-15',
        to: '2021-11-14'
      });
      expect(developmentPhase.length).toBeGreaterThanOrEqual(3);
      
      // 2. マイルストーン達成
      const userMilestones = await whenm.search('reached');
      const productXMilestones = userMilestones.filter(e => 
        e.subject === 'Product X' || e.event?.subject === 'Product X'
      );
      expect(productXMilestones.length).toBeGreaterThanOrEqual(2);
      
      // 3. チーム構成
      const teamAssignments = await whenm.query()
        .verb('assigned')
        .execute();
      const productXTeam = teamAssignments.filter(e =>
        e.object?.includes('Product X')
      );
      expect(productXTeam.some(e => e.subject === 'Alice')).toBe(true);
      expect(productXTeam.some(e => e.subject === 'Bob')).toBe(true);
      
      // 4. 製品の状態遷移
      const statusTransitions = [
        'ideation', 'approved', 'development', 'launched', 
        'maintenance', 'discontinued'
      ];
      for (const status of statusTransitions) {
        const events = await whenm.search(status);
        expect(events.length).toBeGreaterThan(0);
      }
      
      // 5. 製品のピーク時期の特定
      const year2022Events = await whenm.search('Product X', {
        from: '2022-01-01',
        to: '2022-12-31'
      });
      expect(year2022Events.some(e => 
        e.event?.event?.includes('10000 users') ||
        e.object?.includes('10000 users')
      )).toBe(true);
      
      await whenm.reset();
    });
  });

  describe('組織再編と M&A シナリオ', () => {
    it('should track complex organizational restructuring and mergers', async () => {
      const whenm = createMockWhenM();

      // 組織再編の複雑なシナリオ
      const orgEvents = [
        // 初期組織構造
        { event: 'CompanyA established Engineering dept', date: '2020-01-01' },
        { event: 'CompanyA established Sales dept', date: '2020-01-01' },
        { event: 'Alice leads Engineering dept', date: '2020-01-15' },
        { event: 'Bob leads Sales dept', date: '2020-01-15' },
        { event: 'Team Alpha formed under Engineering', date: '2020-03-01' },
        { event: 'Team Beta formed under Engineering', date: '2020-04-01' },
        
        // 最初の再編
        { event: 'CompanyA restructured into Product divisions', date: '2021-01-01' },
        { event: 'Product Division 1 created', date: '2021-01-01' },
        { event: 'Product Division 2 created', date: '2021-01-01' },
        { event: 'Alice reassigned to Product Division 1', date: '2021-01-15' },
        { event: 'Bob reassigned to Product Division 2', date: '2021-01-15' },
        { event: 'Team Alpha moved to Product Division 1', date: '2021-02-01' },
        { event: 'Team Beta moved to Product Division 2', date: '2021-02-01' },
        
        // M&A活動
        { event: 'CompanyA acquired CompanyB', date: '2021-07-01' },
        { event: 'Charlie from CompanyB joined as Integration Lead', date: '2021-07-15' },
        { event: 'CompanyB employees integrated into CompanyA', date: '2021-09-01' },
        { event: 'Diana from CompanyB became VP Operations', date: '2021-09-15' },
        
        // ポストM&A再編
        { event: 'Combined entity renamed to MegaCorp', date: '2022-01-01' },
        { event: 'MegaCorp created three business units', date: '2022-01-15' },
        { event: 'Alice promoted to Business Unit 1 President', date: '2022-02-01' },
        { event: 'Bob promoted to Business Unit 2 President', date: '2022-02-01' },
        { event: 'Charlie promoted to Business Unit 3 President', date: '2022-02-01' },
        
        // スピンオフ
        { event: 'Business Unit 3 spun off as NewCo', date: '2023-01-01' },
        { event: 'Charlie became NewCo CEO', date: '2023-01-01' },
        { event: 'NewCo IPO filed', date: '2023-06-01' },
      ];

      // イベントを記録
      for (const item of orgEvents) {
        await whenm.remember(item.event, item.date);
      }

      // 組織変遷の検証
      
      // 1. 初期構造の確認
      const year2020 = await whenm.search('', {
        from: '2020-01-01',
        to: '2020-12-31'
      });
      expect(year2020.some(e => 
        e.event?.event?.includes('Engineering dept') ||
        e.object?.includes('Engineering dept')
      )).toBe(true);
      
      // 2. 再編の追跡
      const restructuring = await whenm.search('restructured');
      expect(restructuring).toHaveLength(1);
      
      const divisions = await whenm.search('Division');
      expect(divisions.length).toBeGreaterThanOrEqual(4);
      
      // 3. M&A活動
      const acquisition = await whenm.search('acquired');
      expect(acquisition).toHaveLength(1);
      expect(acquisition[0].object).toContain('CompanyB');
      
      // 4. リーダーシップの変遷
      const aliceCareer = await whenm.timeline('Alice')
        .between('2020-01-01', '2023-12-31');
      expect(aliceCareer).toBeDefined();
      
      const alicePositions = await whenm.query()
        .subject('Alice')
        .execute();
      expect(alicePositions.length).toBeGreaterThanOrEqual(3);
      
      // 5. スピンオフの確認
      const spinoff = await whenm.search('spun off');
      expect(spinoff).toHaveLength(1);
      
      const newCo = await whenm.search('NewCo');
      expect(newCo.some(e => e.subject === 'Charlie')).toBe(true);
      
      // 6. 特定時点での組織構造スナップショット
      const structure2020 = await whenm.ask('What was the organization structure?', '2020-12-31');
      expect(structure2020).toBeDefined();
      
      const structure2022 = await whenm.ask('What business units exist?', '2022-12-31');
      expect(structure2022).toBeDefined();
      
      await whenm.reset();
    });
  });

  describe('複雑なクエリと分析', () => {
    it('should handle complex analytical queries across time', async () => {
      const whenm = createMockWhenM();

      // 複数の関連するイベントストリーム
      const events = [
        // プロジェクトストリーム
        { event: 'Project Mercury started', date: '2023-01-01' },
        { event: 'Project Venus started', date: '2023-02-01' },
        { event: 'Project Mars started', date: '2023-03-01' },
        
        // 人員割り当てストリーム
        { event: 'Alice assigned to Project Mercury', date: '2023-01-05' },
        { event: 'Bob assigned to Project Mercury', date: '2023-01-05' },
        { event: 'Charlie assigned to Project Venus', date: '2023-02-05' },
        { event: 'Alice reassigned to Project Venus', date: '2023-03-01' },
        { event: 'Diana assigned to Project Mars', date: '2023-03-05' },
        { event: 'Bob reassigned to Project Mars', date: '2023-04-01' },
        
        // 成果物ストリーム
        { event: 'Project Mercury delivered Phase 1', date: '2023-02-15' },
        { event: 'Project Venus delivered prototype', date: '2023-03-15' },
        { event: 'Project Mercury delivered Phase 2', date: '2023-04-15' },
        { event: 'Project Mars delivered MVP', date: '2023-05-01' },
        
        // ステータス更新ストリーム
        { event: 'Project Mercury status green', date: '2023-01-15' },
        { event: 'Project Venus status yellow', date: '2023-02-20' },
        { event: 'Project Mercury status yellow', date: '2023-03-10' },
        { event: 'Project Venus status green', date: '2023-03-25' },
        { event: 'Project Mars status green', date: '2023-04-10' },
        { event: 'Project Mercury completed', date: '2023-05-15' },
      ];

      for (const item of events) {
        await whenm.remember(item.event, item.date);
      }

      // 複雑なクエリと分析
      
      // 1. 特定時点でのアクティブプロジェクト
      const activeProjectsMarch = await whenm.search('Project', {
        from: '2023-03-01',
        to: '2023-03-31'
      });
      const marchProjects = new Set(
        activeProjectsMarch
          .map(e => {
            const match = (e.event?.event || e.subject || '').match(/Project (\w+)/);
            return match ? match[1] : null;
          })
          .filter(Boolean)
      );
      expect(marchProjects.size).toBeGreaterThanOrEqual(3);
      
      // 2. 人員の稼働率分析
      const aliceAssignments = await whenm.query()
        .subject('Alice')
        .verb('assigned')
        .execute();
      expect(aliceAssignments).toHaveLength(1);
      
      const aliceReassignments = await whenm.query()
        .subject('Alice')
        .verb('reassigned')
        .execute();
      expect(aliceReassignments).toHaveLength(1);
      
      // 3. プロジェクトの健全性トレンド
      const statusUpdates = await whenm.search('status');
      const mercuryStatus = statusUpdates.filter(e =>
        (e.event?.event || e.subject || '').includes('Mercury')
      );
      expect(mercuryStatus.length).toBeGreaterThanOrEqual(2);
      
      // 4. 納期遵守率
      const deliveries = await whenm.search('delivered');
      expect(deliveries.length).toBeGreaterThanOrEqual(4);
      
      const completions = await whenm.search('completed');
      expect(completions).toHaveLength(1);
      
      // 5. クロスプロジェクト依存関係
      const bobMovement = await whenm.timeline('Bob')
        .between('2023-01-01', '2023-05-31');
      expect(bobMovement).toBeDefined();
      
      // 6. 自然言語での複合クエリ
      const complexQuery = whenm.nl('Which projects had status yellow?')
        .and('Who was assigned to Project Mars?')
        .and('What was delivered in March?');
      
      const results = await complexQuery.execute();
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      await whenm.reset();
    });
  });
});