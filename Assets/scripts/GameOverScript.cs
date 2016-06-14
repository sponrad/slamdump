using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using GooglePlayGames;
using GooglePlayGames.BasicApi;
using UnityEngine.SocialPlatforms;

public class GameOverScript : MonoBehaviour {

	public Text scoreText;
	public int score;

	// Use this for initialization
	void Start () {
		score = GameObject.Find ("Control").GetComponent<SlamDumpControl> ().score;
		scoreText.text = score.ToString();

		Social.ReportScore(score, scripts.GPGIds.leaderboard_score, (bool success) => {
			// handle success or failure
		});
	}
	
	// Update is called once per frame
	void Update () {
	
	}
}
