use rand::Rng;
use super::*;

#[derive(Copy, Clone, Debug)]
struct TestArm {
    id: usize
}
impl Rankable for TestArm {
    fn ident(&self) -> String {
        self.id.to_string()
    }
}
#[test]
fn test_random_ranker() {
    //refrence: https://colab.research.google.com/drive/1R5QiVlF6w08dyQmTE6AoBi-TfjOoXcSk#scrollTo=8HDhqWdzi2oD
    let mut rng = rand::thread_rng();
    let num_of_arms: usize = 10;
    let turns = 1000;
    let batch_size = 10;

    let mut arms = Vec::<TestArm>::new();
    let mut conversions = HashMap::new();
    for i in 0..num_of_arms {
        let arm = TestArm { id: i };
        arms.push(arm);
        let conv = (rng.gen_range(0..100) as f32) / 100.0;
        conversions.insert(arm.id, conv);
    }
    
    println!("{:?}", arms);
    println!("{:?}", conversions);
    let mut ranker = DefaultRanker::<TestArm>::default();
    
    let user_info = HashMap::new();

    for t in 0..turns {
        if t % 10000 == 0 {
            println!("{:?}...", t);
        }

        let top_actions = ranker.rank(&user_info, &arms, 10);

        let mut feedbacks = Vec::new();
        for (action, _score) in top_actions {
            let mut stat = Stat::default();
            for _ in 0..batch_size {
                if rand::random::<f32>() < *conversions.get(&action.id).unwrap_or(&0.0) {
                    stat.update(1, 0);
                } else {
                    stat.update(0, 1);
                }
            }
            feedbacks.push(Feedback { arm: action, reward: stat});
        }
        ranker.update(&feedbacks);
    }

    let top_actions = ranker.rank(&user_info, &arms, num_of_arms);
    for (action, score) in top_actions {
        println!("{:?}: {:?} = {:?}", action, score, conversions.get(&action.id));
    }
}