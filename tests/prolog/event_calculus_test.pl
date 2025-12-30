%% =============================================================================
%% Event Calculus Test Suite
%% =============================================================================
%% Native Prolog tests for the WhenM Event Calculus engine
%% Run with: swipl -g "run_tests." -t halt tests/prolog/event_calculus_test.pl
%% =============================================================================

:- use_module(library(plunit)).
:- consult('../../prolog/event_calculus.pl').

%% =============================================================================
%% Test Fixtures and Helpers
%% =============================================================================

%% Helper to set up a clean test environment
setup_test_env :-
    retractall(happens(_, _)),
    retractall(current_date(_)),
    assertz(current_date("2025-01-01")).

%% Helper to assert multiple events
assert_events([]).
assert_events([happens(Event, Time)|Rest]) :-
    assertz(happens(Event, Time)),
    assert_events(Rest).

%% =============================================================================
%% Core Event Calculus Tests
%% =============================================================================

:- begin_tests(event_calculus_core).

test(basic_holds_at, [setup(setup_test_env)]) :-
    % User learns Python on 2024-01-01
    assertz(happens(learned(user, python), "2024-01-01")),
    % Check it holds at various times
    assertion(holds_at(knows(user, python), "2024-01-01")),
    assertion(holds_at(knows(user, python), "2024-06-01")),
    assertion(holds_at(knows(user, python), "2025-01-01")).

test(fluent_termination, [setup(setup_test_env)]) :-
    % User joins club, then quits
    assertz(happens(joined(user, chess_club), "2024-01-01")),
    assertz(happens(quit(user, chess_club), "2024-06-01")),
    % Should hold before quit
    assertion(holds_at(member_of(user, chess_club), "2024-03-01")),
    % Should not hold after quit
    assertion(\+ holds_at(member_of(user, chess_club), "2024-07-01")).

test(clipped_predicate, [setup(setup_test_env)]) :-
    % Test the clipped/3 predicate directly
    assertz(happens(joined(user, club), "2024-01-01")),
    assertz(happens(quit(user, club), "2024-06-01")),
    % Fluent is clipped between initiation and after termination
    assertion(clipped("2024-01-01", member_of(user, club), "2024-07-01")),
    % Not clipped if we check before termination
    assertion(\+ clipped("2024-01-01", member_of(user, club), "2024-05-01")).

test(holds_now_predicate, [setup(setup_test_env)]) :-
    % Set current date
    retractall(current_date(_)),
    assertz(current_date("2024-12-01")),
    % Add event before current date
    assertz(happens(learned(user, prolog), "2024-06-01")),
    % Should hold "now"
    assertion(holds_now(knows(user, prolog))).

:- end_tests(event_calculus_core).

%% =============================================================================
%% Pattern-Based Rules Tests
%% =============================================================================

:- begin_tests(pattern_rules).

test(started_pattern, [setup(setup_test_env)]) :-
    % Test started_ prefix creates accumulating fluent
    assertz(happens(started_knows(user, java), "2024-01-01")),
    assertion(holds_at(knows(user, java), "2024-06-01")).

test(stopped_pattern, [setup(setup_test_env)]) :-
    % Test stopped_ prefix terminates fluent
    assertz(happens(started_member_of(user, gym), "2024-01-01")),
    assertz(happens(stopped_member_of(user, gym), "2024-06-01")),
    assertion(holds_at(member_of(user, gym), "2024-03-01")),
    assertion(\+ holds_at(member_of(user, gym), "2024-07-01")).

test(became_pattern_singular, [setup(setup_test_env)]) :-
    % Test became_ creates singular fluent (replaces previous)
    assertz(happens(became_role(user, developer), "2024-01-01")),
    assertz(happens(became_role(user, tech_lead), "2024-06-01")),
    % Old role should not hold after new one
    assertion(\+ holds_at(role(user, developer), "2024-07-01")),
    % New role should hold
    assertion(holds_at(role(user, tech_lead), "2024-07-01")).

test(pattern_fluent_helper, [setup(setup_test_env)]) :-
    % Test the pattern_fluent/3 helper
    assertion(pattern_fluent(started_, started_knows(user, rust), knows(user, rust))),
    assertion(pattern_fluent(became_, became_role(user, manager), role(user, manager))),
    assertion(\+ pattern_fluent(started_, not_matching(user, x), _)).

test(pattern_fluent_wildcard_helper, [setup(setup_test_env)]) :-
    % Test wildcard matching for singular fluents
    assertion(pattern_fluent_wildcard(became_, became_role(user, manager), role(user, _))),
    % Should preserve subject, wildcard the value
    pattern_fluent_wildcard(became_, became_role(john, manager), Fluent),
    Fluent = role(john, _).

:- end_tests(pattern_rules).

%% =============================================================================
%% Semantic Event Rules Tests
%% =============================================================================

:- begin_tests(semantic_events).

test(knowledge_events, [setup(setup_test_env)]) :-
    assert_events([
        happens(learned(user, python), "2024-01-01"),
        happens(studied(user, javascript), "2024-02-01"),
        happens(mastered(user, rust), "2024-03-01"),
        happens(met(user, alice), "2024-04-01")
    ]),
    assertion(holds_at(knows(user, python), "2024-06-01")),
    assertion(holds_at(knows(user, javascript), "2024-06-01")),
    assertion(holds_at(knows(user, rust), "2024-06-01")),
    assertion(holds_at(knows(user, alice), "2024-06-01")).

test(membership_events, [setup(setup_test_env)]) :-
    assert_events([
        happens(joined(user, chess_club), "2024-01-01"),
        happens(left(user, chess_club), "2024-03-01"),
        happens(joined(user, book_club), "2024-02-01")
    ]),
    assertion(\+ holds_at(member_of(user, chess_club), "2024-06-01")),
    assertion(holds_at(member_of(user, book_club), "2024-06-01")).

test(possession_events, [setup(setup_test_env)]) :-
    assert_events([
        happens(bought(user, car), "2024-01-01"),
        happens(acquired(user, house), "2024-02-01"),
        happens(sold(user, car), "2024-06-01"),
        happens(got(user, bike), "2024-07-01")
    ]),
    assertion(\+ holds_at(has(user, car), "2024-08-01")),
    assertion(holds_at(has(user, house), "2024-08-01")),
    assertion(holds_at(has(user, bike), "2024-08-01")).

test(location_singular, [setup(setup_test_env)]) :-
    assert_events([
        happens(moved_to(user, tokyo), "2024-01-01"),
        happens(moved_to(user, osaka), "2024-06-01"),
        happens(relocated_to(user, kyoto), "2024-09-01")
    ]),
    % Only most recent location should hold
    assertion(\+ holds_at(lives_in(user, tokyo), "2024-10-01")),
    assertion(\+ holds_at(lives_in(user, osaka), "2024-10-01")),
    assertion(holds_at(lives_in(user, kyoto), "2024-10-01")).

test(relationship_events, [setup(setup_test_env)]) :-
    assert_events([
        happens(married(user, alice), "2024-01-01"),
        happens(divorced(user, alice), "2024-06-01"),
        happens(married(user, bob), "2024-09-01")
    ]),
    assertion(\+ holds_at(married_to(user, alice), "2024-07-01")),
    assertion(holds_at(married_to(user, bob), "2024-10-01")).

test(preference_events, [setup(setup_test_env)]) :-
    assert_events([
        happens(started_liking(user, coffee), "2024-01-01"),
        happens(started_disliking(user, tea), "2024-02-01"),
        happens(stopped_liking(user, coffee), "2024-06-01")
    ]),
    assertion(\+ holds_at(likes(user, coffee), "2024-07-01")),
    assertion(holds_at(dislikes(user, tea), "2024-07-01")).

test(pet_events_3arity, [setup(setup_test_env)]) :-
    assert_events([
        happens(got_pet(user, dog, rex), "2024-01-01"),
        happens(got_pet(user, cat, whiskers), "2024-02-01"),
        happens(lost_pet(user, dog, rex), "2024-06-01")
    ]),
    assertion(\+ holds_at(has_pet(user, dog, rex), "2024-07-01")),
    assertion(holds_at(has_pet(user, cat, whiskers), "2024-07-01")).

test(business_events, [setup(setup_test_env)]) :-
    assert_events([
        happens(started_business(user, startup_a), "2024-01-01"),
        happens(founded(user, startup_b), "2024-02-01"),
        happens(sold_business(user, startup_a), "2024-06-01"),
        happens(closed_business(user, startup_b), "2024-09-01")
    ]),
    assertion(\+ holds_at(owns(user, startup_a), "2024-10-01")),
    assertion(\+ holds_at(owns(user, startup_b), "2024-10-01")).

test(employment_singular, [setup(setup_test_env)]) :-
    assert_events([
        happens(hired_at(user, company_a), "2024-01-01"),
        happens(left_company(user, company_a), "2024-06-01"),
        happens(joined_company(user, company_b), "2024-07-01")
    ]),
    assertion(\+ holds_at(employed_at(user, company_a), "2024-08-01")),
    assertion(holds_at(employed_at(user, company_b), "2024-08-01")).

test(project_events, [setup(setup_test_env)]) :-
    assert_events([
        happens(started_project(user, project_a), "2024-01-01"),
        happens(started_project(user, project_b), "2024-02-01"),
        happens(finished_project(user, project_a), "2024-06-01"),
        happens(abandoned_project(user, project_b), "2024-07-01")
    ]),
    assertion(\+ holds_at(working_on(user, project_a), "2024-08-01")),
    assertion(\+ holds_at(working_on(user, project_b), "2024-08-01")).

test(learning_progression, [setup(setup_test_env)]) :-
    assert_events([
        happens(started_learning(user, spanish), "2024-01-01"),
        happens(finished_learning(user, spanish), "2024-06-01"),
        happens(started_learning(user, french), "2024-07-01")
    ]),
    % Spanish: not learning anymore, but knows it
    assertion(\+ holds_at(learning(user, spanish), "2024-08-01")),
    assertion(holds_at(knows(user, spanish), "2024-08-01")),
    % French: still learning
    assertion(holds_at(learning(user, french), "2024-08-01")),
    assertion(\+ holds_at(knows(user, french), "2024-08-01")).

:- end_tests(semantic_events).

%% =============================================================================
%% Query Helpers Tests
%% =============================================================================

:- begin_tests(query_helpers).

test(all_holding, [setup(setup_test_env)]) :-
    assert_events([
        happens(learned(user, python), "2024-01-01"),
        happens(joined(user, club), "2024-02-01"),
        happens(bought(user, car), "2024-03-01")
    ]),
    all_holding("2024-06-01", Fluents),
    assertion(member(knows(user, python), Fluents)),
    assertion(member(member_of(user, club), Fluents)),
    assertion(member(has(user, car), Fluents)).

test(all_events, [setup(setup_test_env)]) :-
    assert_events([
        happens(learned(user, python), "2024-01-01"),
        happens(joined(user, club), "2024-02-01")
    ]),
    all_events(Events),
    assertion(length(Events, 2)),
    assertion(member(happens(learned(user, python), "2024-01-01"), Events)).

test(events_between, [setup(setup_test_env)]) :-
    assert_events([
        happens(event1, "2024-01-01"),
        happens(event2, "2024-03-01"),
        happens(event3, "2024-06-01"),
        happens(event4, "2024-09-01")
    ]),
    events_between("2024-02-01", "2024-07-01", Events),
    assertion(length(Events, 2)),
    assertion(member(happens(event2, "2024-03-01"), Events)),
    assertion(member(happens(event3, "2024-06-01"), Events)).

test(ever_held, [setup(setup_test_env)]) :-
    assert_events([
        happens(learned(user, python), "2024-01-01"),
        happens(joined(user, club), "2024-02-01"),
        happens(quit(user, club), "2024-06-01")
    ]),
    assertion(ever_held(knows(user, python))),
    assertion(ever_held(member_of(user, club))),
    assertion(\+ ever_held(has(user, spaceship))).

test(fluent_timeline, [setup(setup_test_env)]) :-
    assert_events([
        happens(joined(user, club), "2024-01-01"),
        happens(quit(user, club), "2024-06-01"),
        happens(joined(user, club), "2024-09-01")
    ]),
    fluent_timeline(member_of(user, club), Timeline),
    assertion(member(event(started, "2024-01-01"), Timeline)),
    assertion(member(event(ended, "2024-06-01"), Timeline)),
    assertion(member(event(started, "2024-09-01"), Timeline)).

:- end_tests(query_helpers).

%% =============================================================================
%% Utility Predicates Tests
%% =============================================================================

:- begin_tests(utilities).

test(assert_retract_event, [setup(setup_test_env)]) :-
    assert_event(test_event, "2024-01-01"),
    assertion(happens(test_event, "2024-01-01")),
    retract_event(test_event, "2024-01-01"),
    assertion(\+ happens(test_event, "2024-01-01")).

test(clear_person, [setup(setup_test_env)]) :-
    assert_events([
        happens(learned(alice, python), "2024-01-01"),
        happens(joined(alice, club), "2024-02-01"),
        happens(learned(bob, java), "2024-03-01")
    ]),
    clear_person(alice),
    assertion(\+ happens(learned(alice, python), _)),
    assertion(\+ happens(joined(alice, club), _)),
    assertion(happens(learned(bob, java), "2024-03-01")).

test(clear_all, [setup(setup_test_env)]) :-
    assert_events([
        happens(event1, "2024-01-01"),
        happens(event2, "2024-02-01"),
        happens(event3, "2024-03-01")
    ]),
    clear_all,
    all_events(Events),
    assertion(Events = []).

test(date_comparison, [setup(setup_test_env)]) :-
    assertion(date_before("2024-01-01", "2024-06-01")),
    assertion(\+ date_before("2024-06-01", "2024-01-01")),
    assertion(date_after("2024-06-01", "2024-01-01")),
    assertion(date_between("2024-03-01", "2024-01-01", "2024-06-01")),
    assertion(\+ date_between("2024-09-01", "2024-01-01", "2024-06-01")).

:- end_tests(utilities).

%% =============================================================================
%% Edge Cases and Complex Scenarios
%% =============================================================================

:- begin_tests(edge_cases).

test(multiple_initiations_same_fluent, [setup(setup_test_env)]) :-
    % Multiple ways to gain the same knowledge
    assert_events([
        happens(learned(user, python), "2024-01-01"),
        happens(studied(user, python), "2024-02-01"),
        happens(mastered(user, python), "2024-03-01")
    ]),
    % Should still hold (accumulating fluent)
    assertion(holds_at(knows(user, python), "2024-06-01")).

test(termination_before_initiation, [setup(setup_test_env)]) :-
    % Terminating event before initiating event (should have no effect)
    assert_events([
        happens(quit(user, club), "2024-01-01"),
        happens(joined(user, club), "2024-06-01")
    ]),
    assertion(\+ holds_at(member_of(user, club), "2024-03-01")),
    assertion(holds_at(member_of(user, club), "2024-07-01")).

test(simultaneous_events, [setup(setup_test_env)]) :-
    % Events happening at the exact same time
    assert_events([
        happens(joined(user, club), "2024-01-01"),
        happens(quit(user, club), "2024-01-01")
    ]),
    % Termination should take precedence when both happen at same time
    assertion(\+ holds_at(member_of(user, club), "2024-01-01")).

test(complex_timeline, [setup(setup_test_env)]) :-
    % Complex user journey
    assert_events([
        happens(moved_to(user, tokyo), "2024-01-01"),
        happens(hired_at(user, company_a), "2024-01-15"),
        happens(started_learning(user, japanese), "2024-02-01"),
        happens(married(user, alice), "2024-03-01"),
        happens(bought(user, house), "2024-04-01"),
        happens(finished_learning(user, japanese), "2024-06-01"),
        happens(left_company(user, company_a), "2024-07-01"),
        happens(joined_company(user, company_b), "2024-07-15"),
        happens(moved_to(user, osaka), "2024-08-01")
    ]),
    % Check state at end of timeline
    assertion(holds_at(lives_in(user, osaka), "2024-12-01")),
    assertion(\+ holds_at(lives_in(user, tokyo), "2024-12-01")),
    assertion(holds_at(employed_at(user, company_b), "2024-12-01")),
    assertion(holds_at(knows(user, japanese), "2024-12-01")),
    assertion(\+ holds_at(learning(user, japanese), "2024-12-01")),
    assertion(holds_at(married_to(user, alice), "2024-12-01")),
    assertion(holds_at(has(user, house), "2024-12-01")).

test(empty_database, [setup(setup_test_env)]) :-
    clear_all,
    % No events means no fluents hold
    assertion(\+ holds_at(knows(user, anything), "2024-06-01")),
    all_holding("2024-06-01", Fluents),
    assertion(Fluents = []).

:- end_tests(edge_cases).

%% =============================================================================
%% Performance Tests (optional, can be skipped for quick runs)
%% =============================================================================

:- begin_tests(performance, [condition(true)]).

test(large_event_set, [setup(setup_test_env), timeout(10)]) :-
    % Generate 100 events
    forall(
        between(1, 100, N),
        (
            atom_concat(skill_, N, Skill),
            format(atom(Date), "2024-01-~|~`0t~d~2|", [N mod 28 + 1]),
            assertz(happens(learned(user, Skill), Date))
        )
    ),
    % Query should complete within reasonable time
    all_holding("2024-06-01", Fluents),
    assertion(length(Fluents, 100)).

test(complex_termination_chain, [setup(setup_test_env), timeout(10)]) :-
    % Create chain of join/quit events
    forall(
        between(1, 50, N),
        (
            atom_concat(club_, N, Club),
            N2 is N * 2,
            format(atom(JoinDate), "2024-01-~|~`0t~d~2|", [N mod 28 + 1]),
            format(atom(QuitDate), "2024-02-~|~`0t~d~2|", [N mod 28 + 1]),
            assertz(happens(joined(user, Club), JoinDate)),
            assertz(happens(quit(user, Club), QuitDate))
        )
    ),
    % All should be terminated
    all_holding("2024-06-01", Fluents),
    assertion(Fluents = []).

:- end_tests(performance).

%% =============================================================================
%% Test Runner
%% =============================================================================

run_tests :-
    run_tests(event_calculus_core),
    run_tests(pattern_rules),
    run_tests(semantic_events),
    run_tests(query_helpers),
    run_tests(utilities),
    run_tests(edge_cases),
    run_tests(performance).