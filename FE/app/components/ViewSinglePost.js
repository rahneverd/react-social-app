import Axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';
import DispatchContext from '../DispatchContext';
import StateContext from '../StateContext';
import LoadingDotsIcon from './LoadingDotsIcon';
import NotFound from './NotFound';
import Page from './Page';

function ViewSinglePost(props) {
	const navigate = useNavigate();
	const appState = useContext(StateContext);
	const appDispatch = useContext(DispatchContext);
	const { id } = useParams();
	const [isLoading, setIsLoading] = useState(true);
	const [post, setPost] = useState();

	useEffect(() => {
		const ourRequest = Axios.CancelToken.source();

		async function fetchPost() {
			try {
				const response = await Axios.get(`/post/${id}`, {
					cancelToken: ourRequest.token,
				});
				setPost(response.data);
				setIsLoading(false);
			} catch (e) {
				console.log('There was a problem or the request was cancelled.');
			}
		}
		fetchPost();
		return () => {
			ourRequest.cancel();
		};
	}, [id]);

	if (!isLoading && !post) {
		return <NotFound />;
	}

	if (isLoading)
		return (
			<Page title="...">
				<LoadingDotsIcon />
			</Page>
		);

	const date = new Date(post.createdDate);
	const dateFormatted = `${
		date.getMonth() + 1
	}/${date.getDate()}/${date.getFullYear()}`;

	function isOwner() {
		if (appState.loggedIn) {
			return appState.user.username == post.author.username;
		}
		return false;
	}

	async function deleteHandler() {
		const areYouSure = window.confirm(
			'Do you really want to delete this post?'
		);
		if (areYouSure) {
			try {
				const response = await Axios.delete(`/post/${id}`, {
					data: { token: appState.user.token },
				});
				if (response.data == 'Success') {
					// 1. display a flash message
					appDispatch({
						type: 'flashMessage',
						value: 'Post was successfully deleted.',
					});

					// 2. redirect back to the current user's profile
					navigate(`/profile/${appState.user.username}`);
				}
			} catch (e) {
				console.log('There was a problem.');
			}
		}
	}

	return (
		<Page title={post.title}>
			<div className="d-flex justify-content-between">
				<h2>{post.title}</h2>
				{isOwner() && (
					<span className="pt-2">
						<Link
							to={`/post/${post._id}/edit`}
							data-tip="Edit"
							data-for="edit"
							className="text-primary mr-2"
						>
							<i className="fas fa-edit"></i>
						</Link>
						<ReactTooltip id="edit" className="custom-tooltip" />{' '}
						<a
							onClick={deleteHandler}
							data-tip="Delete"
							data-for="delete"
							className="delete-post-button text-danger"
						>
							<i className="fas fa-trash"></i>
						</a>
						<ReactTooltip id="delete" className="custom-tooltip" />
					</span>
				)}
			</div>

			<div>
				<img
					className="post-image"
					src={'http://localhost:8080' + post?.image?.url}
				/>
			</div>

			<p className="text-muted small mb-4">
				<Link to={`/profile/${post.author.username}`}>
					<img className="avatar-tiny" src={post.author.avatar} />
				</Link>
				Posted by{' '}
				<Link to={`/profile/${post.author.username}`}>
					{post.author.username}
				</Link>{' '}
				on {dateFormatted}
			</p>

			<div className="body-content">
				<ReactMarkdown
					children={post.body}
					allowedElements={[
						'p',
						'br',
						'strong',
						'em',
						'h1',
						'h2',
						'h3',
						'h4',
						'h5',
						'h6',
						'ul',
						'ol',
						'li',
					]}
				/>
			</div>
		</Page>
	);
}

export default ViewSinglePost;
