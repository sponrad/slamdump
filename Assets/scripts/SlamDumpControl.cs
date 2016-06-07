using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class SlamDumpControl : MonoBehaviour {

	public GameObject pooPrefab;
	public GameObject[] enemyPrefabs;
	public Text scoreText;

	public int score = 0;
	public bool gameRunning = true;

	// Use this for initialization
	void Start () {
		//start a timer for creating roaches
		Invoke("SpawnEnemy", 2f);
		gameRunning = true;
	}

	// Update is called once per frame
	void Update () {
		//check for mousedown to spawn projectile
		if (Input.GetMouseButtonDown (0) && gameRunning) {
			Vector3 worldPos = Camera.main.ScreenToWorldPoint(Input.mousePosition);
			worldPos.z = -1f;
			float pooSpawnx = Random.Range (-10f, 10f);
			GameObject instance = Instantiate (pooPrefab, new Vector3(pooSpawnx, 10f, -1f), Quaternion.identity) as GameObject;
			instance.GetComponent<PooControl> ().target = worldPos;
		}

		//update Score
		//GameObject.Find("ScoreText").GetComponent<Text>().\
		scoreText.text = score.ToString();
	}
    
	void SpawnEnemy(){
		Collider2D collider = GameObject.Find ("WaterCollider").GetComponent<Collider2D> ();
		Bounds bounds = collider.bounds;

		float x = 0;
		float y = 0;
		do {
			x = UnityEngine.Random.Range(bounds.center.x - bounds.extents.x, bounds.center.x + bounds.extents.x);
			y = UnityEngine.Random.Range(bounds.center.y - bounds.extents.y, bounds.center.y + bounds.extents.y);
		} while (!collider.OverlapPoint(new Vector2(x, y)) );

		float delay = Random.value * 2f;
			
		if (gameRunning) {
			Instantiate (enemyPrefabs [Random.Range (0, enemyPrefabs.Length)], new Vector3 (x, y, -1f), Quaternion.identity);
			Invoke ("SpawnEnemy", delay);
		}
	}
}
